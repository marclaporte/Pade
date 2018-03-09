window.addEvent("domready", function () {

    doDefaults();

    new FancySettings.initWithManifest(function (settings)
    {
        var background = chrome.extension.getBackgroundPage();

        setDefaultPassword(settings);

        settings.manifest.connect.addEvent("action", function ()
        {
            reloadApp()
        });

        settings.manifest.search.addEvent("action", function ()
        {
            background.findUsers(settings.manifest.searchString.element.value, function(users)
            {
                //console.log("findUsers", users);

                var html = "";

                for (var i=0; i<users.length; i++)
                {
                    var user = users[i];
                    html = html + "<a title='" + user.name + "' name='" + user.room + "' id='" + user.jid + "' href='#'>" + user.name + "</a><br/>";
                }

                if (html == "") html = "No user found";

                settings.manifest.searchResults.element.innerHTML = "<p/><p/>" + html;

                for (var i=0; i<users.length; i++)
                {
                    document.getElementById(users[i].jid).addEventListener("click", function(e)
                    {
                        var user = e.target;
                        console.log("findUsers click", user.id, user.title, user.name);

                        background.acceptCall(user.title, user.id, user.name);
                        background.inviteToConference(user.id, user.name);
                    });
                }
            });
        });

        settings.manifest.popupWindow.addEvent("action", function ()
        {
            if (getSetting("popupWindow"))
            {
                chrome.browserAction.setPopup({popup: ""});

            } else {
                chrome.browserAction.setPopup({popup: "popup.html"});
            }
        });

        settings.manifest.enableChat.addEvent("action", function ()
        {
            if (getSetting("enableChat"))
            {
                background.addChatMenu();

            } else {
               background.removeChatMenu();
            }
        });

        settings.manifest.enableInverse.addEvent("action", function ()
        {
            if (getSetting("enableInverse"))
            {
                background.addInverseMenu();

            } else {
               background.removeInverseMenu();
            }
        });

        settings.manifest.enableTouchPad.addEvent("action", function ()
        {
            if (getSetting("enableTouchPad"))
            {
                background.addTouchPadMenu();

            } else {
               background.removeTouchPadMenu();
            }
        });

        settings.manifest.enableSip.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.useTotp.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.useClientCert.addEvent("action", function ()
        {
            setDefaultPassword(settings);
            background.reloadApp();
        });

        settings.manifest.enableBlog.addEvent("action", function ()
        {
            if (getSetting("enableBlog"))
            {
                background.addBlogMenu();

            } else {
               background.removeBlogMenu();
            }
        });

        settings.manifest.desktopShareMode.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.showOnlyOnlineUsers.addEvent("action", function ()
        {
            background.reloadApp();
        });

        settings.manifest.qrcode.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var url = "https://" + host + "/meet/qrcode.jsp";

                chrome.windows.create({url: url, focused: true, type: "popup"}, function (win)
                {
                    chrome.windows.update(win.id, {drawAttention: true, width: 380, height: 270});
                });
            }
        });

        settings.manifest.certificate.addEvent("action", function ()
        {
            if (window.localStorage["store.settings.server"])
            {
                var host = JSON.parse(window.localStorage["store.settings.server"]);
                var username = JSON.parse(window.localStorage["store.settings.username"]);
                var password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

                var url =  "https://" + host + "/rest/api/restapi/v1/chat/certificate";
                var options = {method: "GET", headers: {"authorization": "Basic " + btoa(username + ":" + password)}};

                console.log("fetch", url, options);

                fetch(url, options).then(function(response){ return response.blob()}).then(function(blob)
                {
                    chrome.downloads.download({url: URL.createObjectURL(blob)});

                }).catch(function (err) {
                    console.error('connection error', err);
                });

            }
        });



        function reloadApp(){

            openAppWindow()
        }

    function openAppWindow()
    {
        if (window.localStorage["store.settings.server"] && window.localStorage["store.settings.domain"] && window.localStorage["store.settings.username"] && window.localStorage["store.settings.password"])
        {
            var lynks = {};

            lynks.server = JSON.parse(window.localStorage["store.settings.server"]);
            lynks.domain = JSON.parse(window.localStorage["store.settings.domain"]);
            lynks.username = JSON.parse(window.localStorage["store.settings.username"]);
            lynks.password = getPassword(JSON.parse(window.localStorage["store.settings.password"]));

            if (lynks.server && lynks.domain && lynks.username && lynks.password)
            {
                var connection = background.getConnection("https://" + lynks.server + "/http-bind/");

                connection.connect(lynks.username + "@" + lynks.domain + "/" + lynks.username, lynks.password, function (status)
                {
                    //console.log("status", status);

                    if (status === 5)
                    {
                        background.reloadApp();
                    }
                    else

                    if (status === 4)
                    {
                        setDefaultPassword(settings);
                        settings.manifest.status.element.innerHTML = '<b>bad username or password</b>';
                    }
                });
            }
            else {
                if (!lynks.server) settings.manifest.status.element.innerHTML = '<b>bad server</b>';
                if (!lynks.domain) settings.manifest.status.element.innerHTML = '<b>bad domain</b>';
                if (!lynks.username) settings.manifest.status.element.innerHTML = '<b>bad username</b>';
                if (!lynks.password) settings.manifest.status.element.innerHTML = '<b>bad password</b>';
            }

        } else settings.manifest.status.element.innerHTML = '<b>bad server, domain, username or password</b>';
    }
    });


});

function doDefaults()
{
    // preferences
    setSetting("desktopShareMode", false)
    setSetting("showOnlyOnlineUsers", true)
    setSetting("popupWindow", true);
    setSetting("useJabra", false);
    setSetting("useWebsocket", false);
    setSetting("disableAudioLevels", false);
    setSetting("enableLipSync", false);
    setSetting("enableChat", false);
    setSetting("audioOnly", false);
    setSetting("enableSip", false);
    setSetting("enableBlog", false);

    // config
    setSetting("startWithAudioMuted", false);
    setSetting("startWithVideoMuted", false);

    // user interface
    setSetting("VERTICAL_FILMSTRIP", true);
    setSetting("FILM_STRIP_MAX_HEIGHT", 90);

    // candy chat
    setSetting("chatWithOnlineContacts", true);
    setSetting("notifyWhenMentioned", true);
}

function setDefaultPassword(settings)
{
    settings.manifest.password.element.disabled = false;

    if (settings.manifest.useClientCert.element.checked)
    {
        settings.manifest.password.element.disabled = true;
        setSetting("password", settings.manifest.username.element.value);
    }
}

function setSetting(name, defaultValue)
{
    console.log("setSetting", name, defaultValue);

    if (!window.localStorage["store.settings." + name])
    {
        if (defaultValue) window.localStorage["store.settings." + name] = JSON.stringify(defaultValue);
    }
}

function getSetting(name)
{
    //console.log("getSetting", name);
    var value = null;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);
    }

    return value;
}

function removeSetting(name)
{
    localStorage.removeItem("store.settings." + name);
}

function getPassword(password)
{
    if (!password || password == "") return null;
    if (password.startsWith("token-")) return atob(password.substring(6));

    window.localStorage["store.settings.password"] = JSON.stringify("token-" + btoa(password));
    return password;
}

