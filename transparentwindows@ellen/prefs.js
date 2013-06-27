const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
}

const TransparentWindowsMyWidget = new GObject.Class({
    Name: 'TransparentWindows.Prefs.TransparentWindowsSettingsWidget',
    GTypeName: 'TransparentWindowsSettingsWidget',
    Extends: Gtk.Grid,

    _init: function(params) {
        this.parent(params);
            this.margin = this.row_spacing = this.column_spacing = 10;

        this._settings = Convenience.getSettings();
        this.attach(new Gtk.Label({ label: 'Windows opacity (Allowed Min is set 50 to avoid troubles)' }), 0, 0, 1, 1);
        let hscale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 50, 255, 1);
            hscale.set_value(this._settings.get_int('opacity'));
            hscale.set_digits(0);
            hscale.set_hexpand(true);
            hscale.connect('value-changed', Lang.bind(this, this._onHpaddingChanged));
        this.attach(hscale, 1, 0, 1, 1);
        this._hscale = hscale;
    },

    _onHpaddingChanged: function (hscale) {
        this._settings.set_int('opacity', this._hscale.get_value());
        //log('hpadding changed! ' + this._settings.get_int('hpadding'));
    }
});

function buildPrefsWidget() {
    let widget = new TransparentWindowsMyWidget();
    widget.show_all();

    return widget;
}
