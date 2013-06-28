const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let settings;
var transparent = "Transparent";
var opaque = "Opaque";
var c_t = "Tr";
var c_o = "Op";
var OpacityHashMap = {};
var opacity_opaque = 255;
var handled_window_types = [
  Meta.WindowType.NORMAL,
  Meta.WindowType.DESKTOP,
  Meta.WindowType.DOCK,
  Meta.WindowType.DIALOG,
  Meta.WindowType.MODAL_DIALOG,
  Meta.WindowType.TOOLBAR,
  Meta.WindowType.MENU,
  Meta.WindowType.UTILITY,
  Meta.WindowType.SPLASHSCREEN,
];

const Indicator = new Lang.Class({
    Name: 'TransparentMenu',
    Extends: PanelMenu.Button,

    _init: function() {
    	//add label state for compact toggle
    	this._labelState = 0; //normal label
    	//get settings from schema
        this._settings = Convenience.getSettings();
        //add panel label for extension
        this.parent(St.Align.START);
        this.label = new St.Label({ text: '' });
        this._updateLabel();
        this.actor.add_actor(this.label);
        //add on/off toggle
        this._tsToggle = new PopupMenu.PopupSwitchMenuItem(_("Transparent windows"), false, { style_class: 'popup-subtitle-menu-item' });
        this._tsToggle.connect('toggled', Lang.bind(this, this._onToggled));
        this._tsToggle.setToggleState(1);
        this.menu.addMenuItem(this._tsToggle);
        //add compact togle
        this._compactToggle = new PopupMenu.PopupSwitchMenuItem(_("Compact extension indicator"), false, { style_class: 'popup-subtitle-menu-item' });
        this._compactToggle.connect('toggled', Lang.bind(this, this._toggleCompact));
        this._compactToggle.setToggleState(0);
        this.menu.addMenuItem(this._compactToggle);
        //add global transparency slider
        this._tsValueTitle = new PopupMenu.PopupMenuItem(_("Global transparency value"), { reactive: false });
        this._tsValueLabel = new St.Label({ text: '' });
        this._tsValueSlider = new PopupMenu.PopupSliderMenuItem(0.81);
        this._tsValueLabel.set_text('%d%'.format(Math.floor((1 - this._tsValueSlider.value)  * 100)));
        this._tsValueSlider.connect('value-changed', Lang.bind(this, function(item) {
            this._tsValueLabel.set_text('%d%'.format(Math.floor((1 - item.value)  * 100)));
        }));
        this._tsValueSlider.connect('drag-end', Lang.bind(this, this._onValueChanged));
        this._tsValueSlider.actor.connect('scroll-event', Lang.bind(this, this._onValueChanged));
        this._tsValueTitle.addActor(this._tsValueLabel, { align: St.Align.END });
        this.menu.addMenuItem(this._tsValueTitle);
        this.menu.addMenuItem(this._tsValueSlider);
        //add active window transparency slider
        this._tsValueTitle_active = new PopupMenu.PopupMenuItem(_("Active window custom transparency"), { reactive: false });
        this._tsValueLabel_active = new St.Label({ text: '' });
        this._tsValueSlider_active = new PopupMenu.PopupSliderMenuItem(0.81);
        this._tsValueLabel_active.set_text('%d%'.format(Math.floor((1 - this._tsValueSlider.value)  * 100)));
        this._tsValueSlider_active.connect('value-changed', Lang.bind(this, function(item) {
            this._tsValueLabel_active.set_text('%d%'.format(Math.floor((1 - item.value)  * 100)));
        }));
        this._tsValueSlider_active.connect('drag-end', Lang.bind(this, this._onValueChanged_active));
        this._tsValueSlider_active.actor.connect('scroll-event', Lang.bind(this, this._onValueChanged_active));
        this._tsValueTitle_active.addActor(this._tsValueLabel_active, { align: St.Align.END });
        this.menu.addMenuItem(this._tsValueTitle_active);
        this.menu.addMenuItem(this._tsValueSlider_active);
        //add remove custom transparency button
        this._clearActiveToggle = new PopupMenu.PopupSwitchMenuItem(_("Clear active window transparency"), false, { style_class: 'popup-subtitle-menu-item' });
        this._clearActiveToggle.connect('toggled', Lang.bind(this, this._onToggled_clear_active));
        this._clearActiveToggle.setToggleState(0);
        this.menu.addMenuItem(this._clearActiveToggle);
		//add clear all custom transparency button
		this._clearAllToggle = new PopupMenu.PopupSwitchMenuItem(_("Clear all custom transparency"), false, { style_class: 'popup-subtitle-menu-item' });
        this._clearAllToggle.connect('toggled', Lang.bind(this, this._onToggled_clear));
        this._clearAllToggle.setToggleState(0);
        this.menu.addMenuItem(this._clearAllToggle);

    },
    
    _updateLabel: function() {
        if (this._settings.get_int('mystate') == 1) {
        	if (!this._labelState) {
				this.label.set_text(transparent);        			
        	} else {
        		this.label.set_text(c_t);
        	}	
        } else {
        	if (!this._labelState) {
	        	this.label.set_text(opaque);
        	} else {
        		this.label.set_text(c_o);
        	}
        }
    },
    
    _toggleCompact: function() {
    	this._labelState = this._compactToggle.state;
    	this._updateLabel(); 
    },
    
    _onToggled_clear: function(){
  		this._clearAllToggle.setToggleState(0);
  		OpacityHashMap = {};
  		updateOpacity();
    },
    
    _onToggled_clear_active: function(){
  		delete OpacityHashMap[getActivePid()];
  		updateOpacity();
  		this._clearActiveToggle.setToggleState(0);
    },
    
    _onValueChanged: function() {
        oppa = Math.floor((this._tsValueSlider.value * 205) + 50);
        this._settings.set_int('opacity', oppa);
        this._updateLabel();
    },
    
    _onValueChanged_active: function() {
        oppa = Math.floor((this._tsValueSlider_active.value * 205) + 50);
		setCustomOpacity(oppa);
    },

    _onToggled: function() {
        mystate = settings.get_int('mystate');
        if (mystate == 1) {
            mydisconnect();
        }
        else if (mystate == 0) {
            settings.set_int('mystate', 1);
        }
        this._updateLabel();
    },

});

function getActivePid() {
	var somepid = false;
	global.get_window_actors().forEach(function(wa) {
           var meta_win = wa.get_meta_window();
           if (meta_win.has_focus()) {
           		somepid = meta_win.get_pid();
           }
    });
    return somepid;
}

function setCustomOpacity(opacity) {
	global.get_window_actors().forEach(function(wa) {
           var meta_win = wa.get_meta_window();
           if (meta_win.has_focus()) {
				OpacityHashMap[meta_win.get_pid()] = opacity;
				setOpacity(wa, opacity);
           }
        });
}

function hasCustomOpacity(pid_id) {
	if (pid_id in OpacityHashMap) {
		return true;
	} else {
		return false;
	}
}

let indicator;

function handled_window_type(wtype) {
    for (var i = 0; i < handled_window_types.length; i++) {
        let hwtype = handled_window_types[i];
        if (hwtype == wtype) {
            return true;
        } else if (hwtype > wtype) {
            return false;
        }
    }
    return false;
}

function setOpacity(window_actor, target_opacity) {
    window_actor.opacity = target_opacity;
}

function toggleState() {
    mystate = settings.get_int('mystate');
    if (mystate == 1) {
        mydisconnect();
    }
    else if (mystate == 0) {
        settings.set_int('mystate', 1);
    }
}

function mydisconnect() {
    global.get_window_actors().forEach(function(window_actor) {
        window_actor.opacity =  opacity_opaque;
    });
    settings.set_int('mystate', 0);
}
function updateOpacity() {
  	var mystate = settings.get_int('mystate');
    if (mystate == 1) {
      	var opacity_transparent = settings.get_int('opacity');
        global.get_window_actors().forEach(function(wa) {
            var meta_win = wa.get_meta_window();
            if (!meta_win) {
                return;
            }
            var wksp = meta_win.get_workspace();
            if (handled_window_type(meta_win.get_window_type())) {
            	var pid = meta_win.get_pid();
            	if (hasCustomOpacity(pid)) {
            		setOpacity(wa, OpacityHashMap[pid]);
            	} else {
            		setOpacity(wa, opacity_transparent);	
            	}
            }
        });
    }
}

function init() {
    settings = Convenience.getSettings();
    settings.set_int('opacity', 225);
    settings.set_int('mystate', 1);
}

function enable() {
    indicator = new Indicator();
    Main.panel.addToStatusArea('myoppacitty', indicator);
    opacityChangedID = settings.connect('changed::opacity', function () { updateOpacity();  });
    stateChangedID = settings.connect('changed::mystate', function () { updateOpacity();  });
    on_window_created = global.display.connect('window-created', updateOpacity);
    updateOpacity();
}

function disable() {
    global.display.disconnect(on_window_created);
    settings.disconnect(opacityChangedID);
    settings.disconnect(stateChangedID);
    mydisconnect();
    indicator.destroy();
}
