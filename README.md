# PokeMobBotMap
A browser map for [PokeMobBot](https://github.com/PocketMobsters/PokeMobBot) using the new websocket API.

A public demo can be found [here](http://pokemap.localhorst.xyz/). Please be aware that my internet provider sometimes has outages. It may not be available at the moment.

![Screenshot of the map](/screenshot.png?raw=true "Screenshot of the map")

## Installation
I recomment using an apache webserver for serving the map because there is an websocket module that can help you to avoid using a second tcp port just for the websocket.
The apache acts then as a "proxy" for the websocket api on `/websocket`.  
First step is to obtain the live map from GitHub. You could download a simple zip-archive [here](https://github.com/0xFEEDC0DE64/PokeMobBotMap/archive/master.zip).  Experienced users can `git clone` it.

### Installation on Windows
Download the latest apache binaries on [Apache Lounge](https://www.apachelounge.com/download/) (httpd-2.4.\*-win64-VC14.zip). Unpack it to somewhere. Open the configuration file (located in `conf/httpd.conf` in your favourite editor. **Change the following configs to match your paths:**

* `ServerRoot "c:/Path/To/Apache24"`
* `DocumentRoot "C:/Path/To/PokeMobBotMap/src"`
* `\<Directory "C:/Path/To/PokeMobBotMap/src"\>`  
Please note that the /src is mandatory unless you moved the src folder somewhere else.

You also need to **uncomment** (removing the hashtag) the following lines:

* `LoadModule proxy_module modules/mod_proxy.so`
* `LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so`

Now you need to configure the websocket proxy thing. Add the following lines on the end of the configuration file:

```
<IfModule proxy_wstunnel_module>
    ProxyPass "/websocket"  "ws://localhost:14251/"
</IfModule>
```

Be sure the **port 14251** matches your websocket port in the bot configuration.

### Installation on Linux
If you know linux well enough, you should understand the needed configuration steps for Windows and be able to "convert" them to a linux basis.  
You need to install apache and the two mods (mod_proxy and mod_proxy_wstunnel).  
The configuration for proxy_wstunnel_module should remain the same.

Feel free to expand this README using pull requests. Thanks!