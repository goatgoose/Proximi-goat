package ProximiGoat;

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

public class ProximiGoat extends JavaPlugin implements Listener {
    @Override
    public void onEnable() {
        getLogger().info("ProximiGoat enabled!");

        getServer().getPluginManager().registerEvents(this, this);

        FileConfiguration config = this.getConfig();
        config.addDefault("socket_server_address", "https://127.0.0.1:1142/");
        config.options().copyDefaults(true);
        saveConfig();

        String socketServerAddress = config.getString("socket_server_address");
        getLogger().info(socketServerAddress);
    }

    @Override
    public void onDisable() {
        getLogger().info("ProximiGoat disabled!");
    }

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        Player player = event.getPlayer();
        Location location = event.getPlayer().getLocation();
        Bukkit.broadcastMessage(player.getDisplayName() + ": " + location.toString());
    }
}
