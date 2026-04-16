package com.api.api.model;

public class TeamModel {
    private String serverName;
    private String serverAddress;
    private String serverUsername;
    private String serverPassword;
    private String consoleUsername;
    private String consolePassword;

    public TeamModel() {}

    public TeamModel(
        String serverName,
        String serverAddress,
        String serverUsername,
        String serverPassword,
        String consoleUsername,
        String consolePassword
    ) {
        this.serverName = serverName;
        this.serverAddress = serverAddress;
        this.serverUsername = serverUsername;
        this.serverPassword = serverPassword;
        this.consoleUsername = consoleUsername;
        this.consolePassword = consolePassword;
    }

    public String getServerName() {
        return this.serverName;
    }

    public String getServerAddress() {
        return this.serverAddress;
    }

    public String getServerUsername() {
        return this.serverUsername;
    }

    public String getServerPassword() {
        return this.serverPassword;
    }

    public String getConsoleUsername() {
        return this.consoleUsername != null ? this.consoleUsername : this.serverUsername;
    }

    public String getConsolePassword() {
        return this.consolePassword != null ? this.consolePassword : this.serverPassword;
    }

    public void setServerName(String name) {
        this.serverName = name;
    }

    public void setServerAddress(String address) {
        this.serverAddress = address;
    }

    public void setServerUsername(String username) {
        this.serverUsername = username;
    }

    public void setServerPassword(String password) {
        this.serverPassword = password;
    }

    public void setConsoleUsername(String consoleUsername) {
        this.consoleUsername = consoleUsername;
    }

    public void setConsolePassword(String consolePassword) {
        this.consolePassword = consolePassword;
    }
}
