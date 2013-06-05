const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let settings;
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
        this._settings = Convenience.getSettings();
        this.parent(St.Align.START);
        this.label = new St.Label({ text: '' });
        this._updateLabel();
        this.actor.add_actor(this.label);
        this._tsToggle = new PopupMenu.PopupSwitchMenuItem(_("Transparent windows"), false, { style_class: 'popup-subtitle-menu-item' });
        this._tsToggle.connect('toggled', Lang.bind(this, this._onToggled));
        this._tsToggle.setToggleState(1);
        this.menu.addMenuItem(this._tsToggle);
        this._tsValueTitle = new PopupMenu.PopupMenuItem(_("Transparency value"), { reactive: false });
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

    },
    _onValueChanged: function() {
        oppa = Math.floor((this._tsValueSlider.value * 205) + 50);
        this._settings.set_int('opacity', oppa);
        _updateLabel();
    },

    _updateLabel: function() {
        if (this._settings.get_int('mystate') == 1) {
            this.label.set_text('Transparent');
        }
        else {
            this.label.set_text('Opaque');
        }
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


let indicator;

function handled_window_type(wtype) {
    for (var i = 0; i < handled_window_types.length; i++) {
        hwtype = handled_window_types[i];
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
    mystate = settings.get_int('mystate');
    if (mystate == 1) {
        opacity_transparent = settings.get_int('opacity');
        global.get_window_actors().forEach(function(wa) {
            var meta_win = wa.get_meta_window();
            if (!meta_win) {
                return;
            }
            var wksp = meta_win.get_workspace();
            if (handled_window_type(meta_win.get_window_type())) {
                setOpacity(wa, opacity_transparent);
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
