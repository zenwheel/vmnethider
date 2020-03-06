/**
 * extension.js
 * Copyright (C) 2018 Tobias Ehrig <me@t0by.eu>
 *
 * VMNetHider is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * VMNetHider is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

let extensionName = Extension.dir.get_basename();
let matchRegExp = /^Ethernet \(vmnet[a-z0-9]+\)$|^Ethernet \(veth[a-z0-9]+\)$|^$/i;

const VMNetHider = new Lang.Class({
    Name : 'vmnethider',

    _init : function() {
        this._nAttempts = 0;
        this._ethDevices = {};
        this._checkDevices();
    },

    _checkDevices : function() {
        if(this._timeoutId){
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = null;
        }

        let _network = Main.panel.statusArea.aggregateMenu._network;
        if (_network) {
            if (!_network._client) {
                if (this._nAttempts++ < 100) {
                    this._timeoutId = Mainloop.timeout_add(1000, Lang.bind(this, this._checkDevices));
                }
            }
            else {
                let _devices = _network._devices.wired.devices;

                for ( var i = 0; i < _devices.length; i++) {
                    if (_devices[i]) {
                        this._deviceAdded(_devices[i]._getDescription(), _devices[i]);
                    }
                }
            }
        }
    },
    _deviceAdded : function(deviceDescription, device) {
        if ( !matchRegExp.test(deviceDescription)) {
            return;
        }

        this._ethDevices[deviceDescription] = {};

        log(extensionName + ' hide: ' + deviceDescription);

        device.item.actor.visible = false;
        this._ethDevices[deviceDescription].device = device;
    },

    _deviceRemoved : function(deviceDescription, device) {
        log(extensionName + ' show: ' + deviceDescription);

        device.item.actor.visible = true;
        delete this._ethDevices[deviceDescription];
    },

    destroy : function() {
        for ( var deviceDescription in this._ethDevices) {
            if (this._ethDevices.hasOwnProperty(deviceDescription)) {
                this._deviceRemoved(deviceDescription, this._ethDevices[deviceDescription].device);
            }
        }
    }
});

let _instance;
function enable() {
    _instance = new VMNetHider();
}

function disable() {
    _instance.destroy();
    _instance = null;
}
