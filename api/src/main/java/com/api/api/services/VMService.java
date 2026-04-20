package com.api.api.services;

import com.api.api.config.TeamConfig;
import com.api.api.helpers.PowerShell;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VMService {
    
    private final PowerShell powerShell;

    @Value("${iso.directory}")
    private String isoDirectory;

    @Value("${configuration.directory}")
    private String configurationDirectory;

    @Value("${harddrives.directory}")
    private String harddrivesDirectory;

    private final TeamConfig teamConfig;

    public VMService(PowerShell powerShell, TeamConfig teamConfig) {
        this.powerShell = powerShell;
        this.teamConfig = teamConfig;
    }

    public String getAllVMs(String server) {
        String command = "$ProgressPreference = 'SilentlyContinue'; Get-VM | Select-Object Name, State, CPUUsage, MemoryAssigned, ProcessorCount | ConvertTo-Json";

        return powerShell.runPowerShell(command, server);
    }

    public List<List<String>> getTeams() {
        return teamConfig.getTeamsSafe();
    }
    
    public String getVM(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = "$ProgressPreference = 'SilentlyContinue'; " +
                        "Get-VM -Name '" + vmName + "' | " +
                        "Select-Object Name, State, CPUUsage, MemoryAssigned, ProcessorCount, Uptime | " +
                        "ConvertTo-Json";
        return powerShell.runPowerShell(command, server);
    }
    
    public String startVM(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = "$ProgressPreference = 'SilentlyContinue'; " +
                "$n = '" + vmName + "'; " +
                "$hdd = Get-VMHardDiskDrive -VMName $n -ErrorAction SilentlyContinue | Select-Object -First 1; " +
                "if($hdd){ Set-VMFirmware -VMName $n -FirstBootDevice $hdd -ErrorAction SilentlyContinue }; " +
                "Start-VM -Name $n; Get-VM -Name $n | Select-Object Name, State | ConvertTo-Json";
        return powerShell.runPowerShell(command, server);
    }
    
    public String stopVM(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = "$ProgressPreference = 'SilentlyContinue'; Stop-VM -Name '" + vmName + "' -Force; Get-VM -Name '" + vmName + "' | Select-Object Name, State | ConvertTo-Json";
        return powerShell.runPowerShell(command, server);
    }
    
    public String restartVM(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = "$ProgressPreference = 'SilentlyContinue'; Restart-VM -Name '" + vmName + "' -Force; Get-VM -Name '" + vmName + "' | Select-Object Name, State | ConvertTo-Json";
        return powerShell.runPowerShell(command, server);
    }
    
    public String getVMStatus(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = "$ProgressPreference = 'SilentlyContinue'; Get-VM -Name '" + vmName + "' | Select-Object Name, State, Status | ConvertTo-Json";
        return powerShell.runPowerShell(command, server);
    }

    public String getVirtualNetworks(String server) {
        String command = "$ProgressPreference = 'SilentlyContinue'; " +
                "Get-VMSwitch | Select-Object @{Name='Name';Expression={$_.Name}}, " +
                "@{Name='SwitchType';Expression={$_.SwitchType.ToString()}}, " +
                "@{Name='NetAdapterInterfaceDescription';Expression={$_.NetAdapterInterfaceDescription}} | " +
                "ConvertTo-Json";
        
        return powerShell.runPowerShell(command, server);
    }

    public String createVM(String vmName, long memorySizeGB, int processorCount, String isoPath, String networkSwitchName, String server) {
        if (vmName == null || vmName.trim().isEmpty()) {
            return "{\"error\": \"VM name is required\"}";
        }

        if (
            powerShell.validatePowershell(vmName) ||
            (isoPath != null && !isoPath.trim().isEmpty() && powerShell.validatePowershell(isoPath)) ||
            (networkSwitchName != null && !networkSwitchName.trim().isEmpty() && powerShell.validatePowershell(networkSwitchName))
        ) {
            return "";
        }

        String trimmedVmName = vmName.trim();
        String escapedVmName = trimmedVmName.replace("'", "''");
        String escapedNetworkSwitchName = networkSwitchName != null ? networkSwitchName.replace("'", "''") : "";
        
        try {
            String cleanupCommand = String.format(
                "$ProgressPreference='SilentlyContinue'; " +
                "$vmName='%s'; " +
                "$vmPath='%s' + '\\' + $vmName; " +
                "if(Get-VM -Name $vmName -ErrorAction SilentlyContinue){ " +
                "  Stop-VM -Name $vmName -Force -TurnOff -ErrorAction SilentlyContinue; " +
                "  Start-Sleep -Milliseconds 500; " +
                "  Remove-VM -Name $vmName -Force; " +
                "  'VM_REMOVED' " +
                "}; " +
                "Start-Sleep -Seconds 2; " +
                "if(Test-Path $vmPath){ " +
                "  Remove-Item -Path $vmPath -Recurse -Force -ErrorAction SilentlyContinue; " +
                "  'FILES_REMOVED' " +
                "}; " +
                "'CLEANUP_DONE'",
                escapedVmName, configurationDirectory
            );
            
            powerShell.runPowerShell(cleanupCommand, server);
            
            Thread.sleep(1000);
        
            // Create the VM
            String createCommand = String.format(
                "$ProgressPreference='SilentlyContinue'; " +
                "$n='%s'; $vmPath='%s'; $m=%dGB; " +
                "New-VM -Name $n -Path $vmPath -MemoryStartupBytes $m -Generation 2 -NoVHD | Out-Null; " +
                "Set-VM -Name $n -ProcessorCount %d; " +
                "Set-VMFirmware -VMName $n -EnableSecureBoot Off; " +
                "Enable-VMIntegrationService -VMName $n -Name 'Guest Service Interface'; " +
                "'VM_CREATED'",
                escapedVmName, configurationDirectory, memorySizeGB, processorCount
            );
                        
            String result1 = powerShell.runPowerShell(createCommand, server);
            if (!result1.contains("VM_CREATED")) {
                return "{\"error\": \"Failed to create VM\"}";
            }

            String createAndAttachVhdCommand = String.format(
                "$ProgressPreference='SilentlyContinue'; " +
                "$n='%s'; $hdRootPath='%s'; $vhdName='%s.vhdx'; " +
                "$vhdFullPath = Join-Path -Path $hdRootPath -ChildPath $vhdName; " +
                "New-VHD -Path $vhdFullPath -SizeBytes 40GB -Dynamic | Out-Null; " +
                "Add-VMHardDiskDrive -VMName $n -Path $vhdFullPath | Out-Null; " +
                "'VHD_CREATED_AND_ATTACHED'",
                escapedVmName, harddrivesDirectory, escapedVmName
            );

            String result2 = powerShell.runPowerShell(createAndAttachVhdCommand, server);
            if (!result2.contains("VHD_CREATED_AND_ATTACHED")) {
                return "{\"error\": \"Failed to create Hard Drive\"}";
            }

            // Connect to virtual network
            if (escapedNetworkSwitchName != null && !escapedNetworkSwitchName.trim().isEmpty()) {
                String networkCommand = String.format(
                    "$ProgressPreference='SilentlyContinue'; " +
                    "$switch='%s'; " +
                    "if(Get-VMSwitch -Name $switch -ErrorAction SilentlyContinue){" +
                    "  Get-VMNetworkAdapter -VMName '%s' | Connect-VMNetworkAdapter -SwitchName $switch; " +
                    "  'NETWORK_CONNECTED'" +
                    "} else {" +
                    "  'NETWORK_NOT_FOUND'" +
                    "}",
                    escapedNetworkSwitchName, escapedVmName
                );
                
                powerShell.runPowerShell(networkCommand, server);
            }
            
            // Add ISO and set boot order
            if (isoPath != null && !isoPath.trim().isEmpty()) {
                String escapedIsoPath = isoPath.replace("'", "''");
                String isoAndBootCommand = String.format(
                    "$ProgressPreference='SilentlyContinue'; " +
                    "$vmName='%s'; $iso='%s'; " +
                    "if(Test-Path $iso){" +
                    "  Add-VMDvdDrive -VMName $vmName -Path $iso; " +
                    "  $dvd = Get-VMDvdDrive -VMName $vmName; " +
                    "  Set-VMFirmware -VMName $vmName -FirstBootDevice $dvd; " +
                    "  'ISO_CONFIGURED'" +
                    "} else {" +
                    "  'ISO_NOT_FOUND'" +
                    "}",
                    escapedVmName, escapedIsoPath
                );
                
                powerShell.runPowerShell(isoAndBootCommand, server);
            }
            
            // Get VM info 
            String infoCommand = String.format(
                "$ProgressPreference='SilentlyContinue'; " +
                "$vm = Get-VM -Name '%s'; " +
                "$adapter = Get-VMNetworkAdapter -VMName '%s' -ErrorAction SilentlyContinue | Select-Object -First 1; " +
                "ConvertTo-Json @{ " +
                "  Name=$vm.Name; " +
                "  State=$vm.State.ToString(); " +
                "  ProcessorCount=$vm.ProcessorCount; " +
                "  MemoryGB=[math]::Round($vm.MemoryStartup/1GB, 2); " +
                "  VmId=$vm.Id.Guid; " +
                "  EnhancedSessionEnabled=$true; " +
                "  NetworkSwitch=if($adapter.SwitchName){$adapter.SwitchName}else{'Not connected'} " +
                "}",
                escapedVmName, escapedVmName
            );
            
            return powerShell.runPowerShell(infoCommand, server);
            
        } catch (Exception e) {
            System.err.println("Error creating VM: " + e.getMessage());
            e.printStackTrace();
            return String.format("{\"error\": \"%s\"}", e.getMessage().replace("\"", "\\\""));
        }
    }

    public String getVmGuid(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = String.format(
            "$ProgressPreference = 'SilentlyContinue'; (Get-VM -Name '%s').Id.Guid",
            vmName
        );

        return powerShell.runPowerShell(command, server).trim();
    }

    public String getVMIPAddress(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }

        String command = String.format(
            "$ProgressPreference = 'SilentlyContinue'; " +
            "$vmName = '%s'; " +
            "for ($i = 0; $i -lt 10; $i++) { " +
            "  $ip = (Get-VMNetworkAdapter -VMName $vmName -ErrorAction SilentlyContinue).IPAddresses | " +
            "         Where-Object { $_ -match '^\\d+\\.\\d+\\.\\d+\\.\\d+$' } | Select-Object -First 1; " +
            "  if ($ip) { ConvertTo-Json $ip; exit } " +
            "  Start-Sleep -Seconds 3 " +
            "} " +
            "ConvertTo-Json @{error='No IP found after retries'}",
            vmName
        );

        return powerShell.runPowerShell(command, server);
    }
    
    public String deleteVM(String vmName, String server) {
        if (powerShell.validatePowershell(vmName)) {
            return "";
        }
        
        String command = "$ProgressPreference = 'SilentlyContinue'; Stop-VM -Name '" + vmName + "' -Force -ErrorAction SilentlyContinue; " +
                        "$ProgressPreference = 'SilentlyContinue'; Remove-VM -Name '" + vmName + "' -Force";
        return powerShell.runPowerShell(command, server);
    }

    public String getAvailableISOs(String server) {        
        String command = "$ProgressPreference = 'SilentlyContinue'; " +
                "if (Test-Path '" + isoDirectory + "') { " +
                "  Get-ChildItem -Path '" + isoDirectory + "' -Filter *.iso | " +
                "  Select-Object @{Name='Name';Expression={$_.Name}}, " +
                "               @{Name='FullPath';Expression={$_.FullName}}, " +
                "               @{Name='SizeGB';Expression={[math]::Round($_.Length/1GB, 2)}}, " +
                "               @{Name='LastModified';Expression={$_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')}} | " +
                "  ConvertTo-Json" +
                "} else { " +
                "  Write-Output '{\"error\": \"ISO directory not found: " + isoDirectory + "\"}'" +
                "}";
        
        return powerShell.runPowerShell(command, server);
    }
}