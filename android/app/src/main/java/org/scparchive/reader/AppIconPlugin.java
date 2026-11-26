package org.scparchive.reader;

import android.content.ComponentName;
import android.content.pm.PackageManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Switches the launcher icon between the official SCP mark and the SCP-CN mark.
 *
 * <p>Both launcher entries are activity-alias declarations in AndroidManifest.xml.
 * The target alias is enabled before the other one is disabled so the launcher
 * never ends up with zero enabled components.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {
    private static final String OFFICIAL_ALIAS =
            "org.scparchive.reader.MainActivityOfficial";
    private static final String CN_ALIAS = "org.scparchive.reader.MainActivityCn";

    @PluginMethod
    public void setIcon(PluginCall call) {
        String icon = call.getString("icon", "official");
        boolean useCn = "cn".equals(icon);
        ComponentName target = new ComponentName(getContext(), useCn ? CN_ALIAS : OFFICIAL_ALIAS);
        ComponentName other = new ComponentName(getContext(), useCn ? OFFICIAL_ALIAS : CN_ALIAS);
        PackageManager manager = getContext().getPackageManager();

        try {
            manager.setComponentEnabledSetting(
                    target,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP);
            manager.setComponentEnabledSetting(
                    other,
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP);
        } catch (RuntimeException error) {
            call.reject("Unable to switch launcher icon", error);
            return;
        }

        call.resolve();
    }
}
