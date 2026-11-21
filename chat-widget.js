// Sparrow Lane chat widget: a chat button and panel for any web page.
// Add it with:  <script src="chat-widget.js" data-api="https://YOUR-API-ADDRESS"></script>
(function () {
  var API = (document.currentScript.getAttribute("data-api") || "").replace(/\/$/, "");
  var KEY = "sparrow-chat-history";
  var MAX = 20;                         // send at most the last 20 messages
  var history = [];                     // the conversation, kept only in this browser tab
  try { history = JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { history = []; }

  var css = "" +
    "#sl-chat-btn{position:fixed;right:20px;bottom:20px;z-index:9999;background:#1f5135;color:#fff;border:0;" +
    "border-radius:28px;padding:14px 20px;font:600 16px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}" +
    "#sl-chat{position:fixed;right:20px;bottom:84px;z-index:9999;width:340px;max-width:calc(100vw - 40px);height:460px;" +
    "max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.3);" +
    "display:flex;flex-direction:column;font:15px/1.4 system-ui,sans-serif;color:#1d1d1d;overflow:hidden}" +
    "#sl-chat[hidden]{display:none}" +
    "#sl-head{background:#1f5135;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}" +
    "#sl-head button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6);border-radius:6px;padding:3px 8px;cursor:pointer}" +
    "#sl-log{flex:1;overflow-y:auto;padding:12px;background:#f6f3ea}" +
    ".sl-msg{margin:6px 0;padding:8px 11px;border-radius:12px;max-width:85%;white-space:pre-wrap;word-wrap:break-word}" +
    ".sl-user{background:#1f5135;color:#fff;margin-left:auto}" +
    ".sl-bot{background:#fff;border:1px solid #e2ddd0}" +
    ".sl-note{color:#8a5a00;font-size:13px;text-align:center}" +
    "#sl-form{display:flex;border-top:1px solid #e2ddd0}" +
    "#sl-input{flex:1;border:0;padding:12px;font:inherit;outline:none}" +
    "#sl-send{border:0;background:#1f5135;color:#fff;padding:0 16px;font:600 15px system-ui,sans-serif;cursor:pointer}" +
    "#sl-send:disabled{opacity:.5}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.id = "sl-chat-btn";
  btn.textContent = "Chat with us";
  var panel = document.createElement("div");
  panel.id = "sl-chat";
  panel.hidden = true;
  panel.innerHTML =
    '<div id="sl-head"><strong>Sparrow Lane assistant</strong><button type="button" id="sl-new">New chat</button></div>' +
    '<div id="sl-log" aria-live="polite"></div>' +
    '<form id="sl-form"><input id="sl-input" maxlength="1000" autocomplete="off" placeholder="Ask about repairs, hire, hours...">' +
    '<button id="sl-send" type="submit">Send</button></form>';
  document.body.appendChild(panel);
  document.body.appendChild(btn);
  var log = panel.querySelector("#sl-log");
  var input = panel.querySelector("#sl-input");
  var send = panel.querySelector("#sl-send");

  function add(cls, text) {                // textContent, never innerHTML: replies are shown as plain text
    var div = document.createElement("div");
    div.className = "sl-msg " + cls;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history)); } catch (e) {} }
  function redraw() {
    log.textContent = "";
    add("sl-bot", "Hello! I can answer questions about our repairs, bike hire and opening hours.");
    history.forEach(function (m) { add(m.role === "user" ? "sl-user" : "sl-bot", m.text); });
  }

  btn.addEventListener("click", function () {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) { redraw(); input.focus(); }
  });
  panel.querySelector("#sl-new").addEventListener("click", function () { history = []; save(); redraw(); });

  panel.querySelector("#sl-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = "";
    history.push({ role: "user", text: text });
    add("sl-user", text);
    var waiting = add("sl-bot", "...");
    send.disabled = true;
    var recent = history.slice(-MAX);
    if (recent[0].role !== "user") recent = recent.slice(1);   // the conversation must start with the user
    fetch(API + "/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: recent })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.error || "request failed");
        waiting.textContent = res.d.reply;
        if (res.d.blocked) {
          history.pop();                                          // forget the blocked message
          add("sl-note", "That message was blocked by our safety filter.");
        } else {
          history.push({ role: "assistant", text: res.d.reply });
        }
        save();
      })
      .catch(function (err) {
        history.pop();
        save();
        waiting.remove();
        add("sl-note", "Sorry, the assistant could not be reached (" + err.message + "). Please call 0113 496 0123.");
      })
      .finally(function () { send.disabled = false; input.focus(); });
  });
})();
