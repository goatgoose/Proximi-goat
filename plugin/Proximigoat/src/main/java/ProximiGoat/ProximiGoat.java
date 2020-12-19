package ProximiGoat;

import org.bukkit.plugin.java.JavaPlugin;

public class ProximiGoat extends JavaPlugin {
    @Override
    public void onEnable() {
        getLogger().info("ProximiGoat enabled!");
    }

    @Override
    public void onDisable() {
        getLogger().info("ProximiGoat disabled!");
    }
}
