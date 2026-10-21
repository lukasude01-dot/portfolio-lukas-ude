/**
 * BOOT  (design variant "bold")
 *
 * PURPOSE:
 * Runs before the page is shown:
 * 1. adds the class "js" to <html> (CSS prepares animations only then)
 * 2. sets html[data-tier] = low | mid | high from the device's power,
 *    so heavy effects (WebGL particles) stay off on weak phones.
 *
 * Separate file because the Content Security Policy forbids inline scripts.
 */
(function () {
    var root = document.documentElement;
    root.classList.add("js");
    try {
        var nav = navigator;
        var memory = nav.deviceMemory;
        var cores = nav.hardwareConcurrency;
        var saveData = nav.connection && nav.connection.saveData;
        var touch = window.matchMedia("(pointer: coarse)").matches;
        var tier = "high";
        if (saveData || (memory && memory <= 2) || (memory && memory <= 4 && cores && cores <= 4)) tier = "low";
        else if (touch) tier = "mid";
        root.dataset.tier = tier;
    } catch (error) {
        root.dataset.tier = "mid";
    }
})();
