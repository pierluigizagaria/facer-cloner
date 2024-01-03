var rule = {
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { urlMatches: 'https://www.facer.io/watchface/.+/edit' },
    }),
  ],
  actions: [
    chrome.declarativeContent.ShowAction
      ? new chrome.declarativeContent.ShowAction()
      : new chrome.declarativeContent.ShowPageAction()
  ]
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([rule]);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.disable();
})

let debuggee, watchfaceId;

const clone = async ({ tabId, url }) => {
  debuggee = { tabId };
  watchfaceId = new URL(url).pathname.split('/')[2];

  const commandParams = {
    patterns: [
      { urlPattern: 'https://www.facer.io/parse/functions/getWatchface' }
    ]
  };

  console.log(`watch face id to clone: ${watchfaceId}`);

  try {
    await chrome.debugger.attach(debuggee, '1.2');
    await chrome.debugger.sendCommand(debuggee, 'Fetch.enable', commandParams);
  } catch (error) {
    console.error(error);
  }

  chrome.tabs.reload(debuggee.tabId);
};

chrome.debugger.onEvent.addListener(async (source, _method, { request, requestId }) => {
  if (source.tabId != debuggee.tabId || _method != 'Fetch.requestPaused') return;

  const { url, headers, method, postData: body } = request;
  console.log('request', request);

  const cloneResponse = await fetch(url, { headers, method, body: JSON.stringify({ ...JSON.parse(body), watchfaceId }) });
  const cloneJson = await cloneResponse.json();
  console.log('clone response', cloneJson);

  const response = await fetch(url, { headers, method, body });
  let json = await response.json();
  console.log('request response', json);

  json.result.draft.url = cloneJson.result.file.url;
  console.log('modified request response', json);

  let responseHeaders = [{ name: 'Access-Control-Allow-Origin', value: 'https://www.facer.io' }];
  response.headers.forEach((value, name) => responseHeaders.push({ name, value }));

  const fulfill = { requestId, responseCode: response.status, responseHeaders, body: btoa(JSON.stringify(json)) };
  await chrome.debugger.sendCommand(debuggee, 'Fetch.fulfillRequest', fulfill);
  await chrome.debugger.detach(debuggee);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (typeof message === 'object' && message.type === 'clone') {
    clone(message.params);
  }
});