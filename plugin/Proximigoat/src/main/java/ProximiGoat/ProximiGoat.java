package ProximiGoat;

import io.socket.client.Ack;
import io.socket.emitter.Emitter;
import okhttp3.ConnectionSpec;
import okhttp3.OkHttpClient;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.plugin.PluginManager;
import org.bukkit.plugin.java.JavaPlugin;

import io.socket.client.IO;
import io.socket.client.Socket;
import org.json.JSONException;
import org.json.JSONObject;

import javax.net.ssl.*;
import java.net.URISyntaxException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

public class ProximiGoat extends JavaPlugin implements Listener {

    Socket socket;

    String socketServerAddress;
    String sessionName;

    @Override
    public void onEnable() {
        getLogger().info("ProximiGoat enabled!");

        getServer().getPluginManager().registerEvents(this, this);

        FileConfiguration config = this.getConfig();
        config.addDefault("socket_server_address", "https://127.0.0.1:1142/");
        config.addDefault("session_name", "MC Session 1");
        config.options().copyDefaults(true);
        saveConfig();

        socketServerAddress = config.getString("socket_server_address");
        getLogger().info("server address: " + socketServerAddress);

        sessionName = config.getString("session_name");
        getLogger().info("session name: " + sessionName);

        try {
            HostnameVerifier myHostnameVerifier = new HostnameVerifier() {
                @Override
                public boolean verify(String hostname, SSLSession session) {
                    return true;
                }
            };
            X509TrustManager[] trustAllCerts= new X509TrustManager[] { new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                }

                public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                }

                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            }};

            SSLContext mySSLContext = null;
            try {
                mySSLContext = SSLContext.getInstance("TLS");
                try {
                    mySSLContext.init(null, trustAllCerts, null);
                } catch (KeyManagementException e) {
                    e.printStackTrace();
                }
            } catch (NoSuchAlgorithmException e) {
                e.printStackTrace();
            }
            OkHttpClient okHttpClient = new OkHttpClient.Builder()
                    .hostnameVerifier(myHostnameVerifier)
                    .sslSocketFactory(mySSLContext.getSocketFactory(), trustAllCerts[0])
                    .connectTimeout(0, TimeUnit.MILLISECONDS)
                    .readTimeout(0, TimeUnit.MILLISECONDS)
                    .writeTimeout(0, TimeUnit.MILLISECONDS)
                    .build();

// default settings for all sockets
            IO.setDefaultOkHttpWebSocketFactory(okHttpClient);
            IO.setDefaultOkHttpCallFactory(okHttpClient);

// set as an option
            IO.Options opts = new IO.Options();
            opts.callFactory = okHttpClient;
            opts.webSocketFactory = okHttpClient;

            socket = IO.socket(socketServerAddress, opts);
            socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... objects) {
                    getLogger().info("socket connected!");
                    socket.emit("register", sessionName, new Ack() {
                        @Override
                        public void call(Object... objects) {
                            getLogger().info((String) objects[0]);
                        }
                    });
                }
            });
            socket.connect();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDisable() {
        getLogger().info("ProximiGoat disabled!");
    }

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        Player player = event.getPlayer();
        Location location = event.getPlayer().getLocation();
        JSONObject obj = new JSONObject();
        try {
            obj.put("session", sessionName);
            obj.put("username", player.getDisplayName());
            obj.put("x", location.getX());
            obj.put("y", location.getY());
            obj.put("z", location.getZ());

            socket.emit("player_move", obj);
        } catch (JSONException e) {
            e.printStackTrace();
        }

    }
}
