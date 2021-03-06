chrome.runtime.sendMessage({ method: "test" }, function ( res ) {
  var storage = res.storage;

  if ( storage && storage.rules ) {
    var rules = JSON.parse(storage.rules);
    for ( var i = 0, len = rules.length; i < len; i++ ) {
      var rule = rules[i];
      var regExp = buildRegExp(rule.url);
      if ( regExp.test(document.location.href) ) {
        if ( rule.enabled ) {
          if ( rule.type === 'url' ) {
            injectRule(rule);
          }
          else if ( rule.type === 'execute' ) {
            evalRule(rule);
          }
        } else {
          console.log('Skipping rule for %s because it is disabled', rule.url);
        }
      }
    }
  }
});

chrome.runtime.onMessage.addListener(function ( request, sender, sendResponse ) {
  if ( request.action === "expire-session" ) {
    var script = document.createElement("script");
    script.async = true;
    script.src = chrome.extension.getURL("src/expire-session.js");
    document.body.appendChild(script);
  }
  if ( request.action === "delete-session" ) {
    var script = document.createElement("script");
    script.async = true;
    script.src = chrome.extension.getURL("src/delete-session.js");
    document.body.appendChild(script);
  }
  else if ( request.action === "show-session-key" ) {
    var script = document.createElement("script");
    script.async = true;
    script.src = chrome.extension.getURL("src/show-session-key.js");
    document.body.appendChild(script);
  }
});

function buildRegExp ( url ) {
  var match = url.match(/^\/(.+?)\/(.*)$/);
  if ( match ) {
    return new RegExp(match[1], match[2]);
  }
  url = url.replace(/([\.\?\[\]\(\)\{\}\\\/\^\$])/g, '\\$1');
  url = url.replace(/\*/g, '.*?');
  return new RegExp('^' + url + '$', 'i');
}

function evalRule ( rule ) {
  console.log('Executing Fanplayr Integration script...');
  var script = document.createElement('script');
  script.innerHTML = rule.content;
  document.body.appendChild(script);
}

function injectRule ( rule ) {
  var url = rule.content || '';

  // Prevent caching.
  if ( rule.preventCache ) {
    url += (url.indexOf('?') >= 0 ? '&' : '?') + 'cache_kill=' + (new Date().getTime());
  }

  console.log('Injecting Fanplayr Integration script: ' + url);
  var first = document.getElementsByTagName('script')[0];
  var script = document.createElement('script');
  script.async = true;
  script.src = url;

  first.parentNode.insertBefore(script, first);
}
