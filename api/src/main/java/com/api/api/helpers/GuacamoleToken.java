package com.api.api.helpers;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GuacamoleToken {

    @Value("${guacamole.secret}")
    private String secretKey;

    public String generateToken(String hostname, int port, String preconnectionBlob, String username, String password, String domain) throws Exception {
        JSONObject settings = new JSONObject();
        settings.put("hostname", hostname);
        settings.put("port", String.valueOf(port));
        settings.put("preconnection-blob", preconnectionBlob);
        settings.put("security", "vmconnect");
        settings.put("ignore-cert", "true");
        settings.put("color-depth", "16");
        settings.put("width", "1024");
        settings.put("height", "768");

        if (username.contains("\\")) {
            String[] parts = username.split("\\\\", 2);
            settings.put("domain", parts[0]);
            settings.put("username", parts[1]);
        } else {
            settings.put("username", username);
            if (domain != null && !domain.isEmpty()) {
                settings.put("domain", domain);
            }
        }
        settings.put("password", password);
        settings.put("resize-method", "display-update");

        JSONObject connection = new JSONObject();
        connection.put("type", "rdp");
        connection.put("settings", settings);

        JSONObject root = new JSONObject();
        root.put("connection", connection);

        return encrypt(root.toString());
    }

    private String encrypt(String data) throws Exception {
        SecureRandom random = new SecureRandom();
        byte[] iv = new byte[16];
        random.nextBytes(iv);

        byte[] keyBytes = secretKey.getBytes("UTF-8");
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("guacamole.secret must be exactly 32 characters for AES-256-CBC");
        }

        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
        byte[] encrypted = cipher.doFinal(data.getBytes("UTF-8"));

        JSONObject tokenJson = new JSONObject();
        tokenJson.put("iv", Base64.getEncoder().encodeToString(iv));
        tokenJson.put("value", Base64.getEncoder().encodeToString(encrypted));

        return Base64.getEncoder().encodeToString(tokenJson.toString().getBytes("UTF-8"));
    }
}
