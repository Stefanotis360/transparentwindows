Transparentwindows
==================

### Extension for adding windows transparency to gnome-shell.
* support for global transparency setting
* support for per window transparency setting

#### Tested on:
* 3.8.2 
* 3.9.2 

### How to use:
* select globar transparency from the menu to set transparency for all new / currently existing windows
* to set a custom transparency value to a window, select it then use the active window slider to set the required transparency.
* NOTE: windows with custom transparency will ignore global transparency settings
* to remove custom transparency value from a window, select it and click "clear active window transparency", it will reset it to the global transparency value.

### TODO
* if a window with custom transparency is closed before removing this value, tiny data may stay until the session ends or the extension is disabled or the shell is reloaded. Ooops...(its jus a unique ID, so you probably won't even notice this... unless you open several thousands of windows.) Workaround: remove custom transparency before clowsing a window or clear all custom transparency.


HOW TO INSTALL:
---------------

A. https://extensions.gnome.org/extension/684/transparent-windows/

B. Grab it from here
