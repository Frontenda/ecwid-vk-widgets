/*
 * A script for Ecwid to display Vkontakte social widgets (like, share, comments) on the product pages.
 * Please include it after the Ecwid integration code.
 */

function dbg(v) {
  console.log(v);
}


var EcwidVkWidgets = (function(module) {
  // Private
  var _config;
  var _activeWidgets = [];

  // Extend module or object
  function _extend(target, src, isRecursive) {
    var targetType = typeof (target);
    var srcType = typeof (src);
    if (
      'undefined' == targetType
      || 'undefined' == srcType
    ) {
      return src || target;
    }

    if (target === src) {
      return target;
    }

    if ('object' == srcType) {
      if ('object' != targetType) {
        target = {};
      }
      for (var key in src) {
        if (isRecursive) {
          target[key] = _extend(target[key], src[key], isRecursive);

        } else {
          target[key] = src[key];
        }
      }
    }

    return target;
  }
  
  // Set configuration
  function _setConfig(userConfig) {
    dbg('_____hey!');
    _config = _extend(EcwidVkWidgets.DefaultConfig, userConfig, true);
  }

  // Check if at least widget is enabled
  function _isEnabled() {
    return (_activeWidgets.length > 0);
  }

  // Prepare and show widgets on teh current page
  function _showProductPageWidgets() {
    // Get the product information
    var productInfo = EcwidVkWidgets.EcwidApi.getEcwidProductInfo();

    // Get the page URL
    var pageUrl = window.location;

    // Show widgets
    for (var i in _activeWidgets) {
      _activeWidgets[i].show(productInfo, pageUrl);
    }
  }

  // Init VK Widgets
  function _start() {
    // Init VK API
    VK.init({
      apiId: _config.vkApiId, 
      onlyWidgets: true
    });

    // Init enabled widgets (create widget objects)
    for (var widgetType in _config.appearance) { // dbg: undef
      if (_config.appearance[widgetType].enabled) {
        _activeWidgets[_activeWidgets.length] = EcwidVkWidgets.WidgetsFactory.createWidget(widgetType, _config.appearance[widgetType]);
      }
    }
    
    // Attach handlers if needed
    if (_isEnabled()) {
      EcwidVkWidgets.EcwidApi.attachProductPageLoadedHandler(_showProductPageWidgets);
    }
  }

  var _load = function(config) { // dbg: var?
    // Check if Ecwid is loaded
    if (
      typeof (window.Ecwid) !== 'object' // dbg: removed vkApiId check
    ) {
      return; //dbg: console.warn or console.error
    }

    // Set configuration
    _setConfig(config);

    // Load dependencies and start Ecwid.OnPageLoadedListening // dbg
    EcwidVkWidgets.Loader.load(
      [
        {
          test: window.jQuery,
          sources: ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js']
        },
        {
          test: window.VK,
          sources: [
            'http://userapi.com/js/api/openapi.js?48',
            'http://vkontakte.ru/js/api/share.js?9'
          ]
        }
      ],
      _start
    );
  }

  // Public
  return (_extend(
    module,
    {
      extend: _extend,
      load: _load
    }
  ));
}(EcwidVkWidgets || {}));

/*
 * DefaultConfig
 */
EcwidVkWidgets.DefaultConfig = (function(module) {
  // Widgets' default settings. Please refer to the Vkontakte API documentation for details.
  var _config = {
    vkApiId: '',
    appearance: {
      like: {
        enabled: true,
        elmId: "ecwid_vk_like",
        shareTextMaxLength: 140, // VK restrictions
        elmParentSelector: ".ecwid-productBrowser-details-like", // widget's place
        elmCssClass: "ecwid-vk-like",

        type: 'full', // {'full', 'button', 'mini', 'vertical'}
        width: 250,
        height: 22,
        verb: 0 // {0, 1}
      },

      share: {
        enabled: true,
        elmId: "ecwid_vk_share",
        shareTextMaxLength: 140, // VK restrictions
        elmParentSelector: ".ecwid-productBrowser-details-like", // widget's place
        elmCssClass: "ecwid-vk-share",

        noparse: true
      },

      comments: {
        enabled: true,
        elmId: "ecwid_vk_comments",
        elmParentSelector: ".ecwid-productBrowser-details-comments", // widget's place
        elmCssClass: "ecwid-vk-comments",

        width: 500, // {300-inf}
        limit: 10, // {5-100}
        attach: '*', // { 'graffiti', 'photo', 'audio', 'video', 'link', '*' }
        autoPublish: 1, // {0, 1}
        mini: 'auto', // { 0, 1, 'auto' }
        height: 500, // {0, 500-inf}
        norealtime: 0 // {0, 1}
      }
    }
  }

  return (EcwidVkWidgets.extend(module, _config, true));

}(EcwidVkWidgets.DefaultConfig || {}));


/*
 * Loader
 */
EcwidVkWidgets.Loader = (function(module) {
  // Private
  var _scripts = [];
  var _numScripts = 0;
  var _completeCallback = function() {}; //dbg : comment

  function _onScriptLoaded() {
    if (--_numScripts <= 0) {
      _completeCallback();
    }
  }

  var _injectJs = function(src, callback) {
    var script = document.createElement("script");
    script.setAttribute("src", src);
    script.charset = "utf-8";
    script.setAttribute("type", "text/javascript");
    script.onreadystatechange = script.onload = callback;
    //document.getElementsByTagName('HEAD').item(0).appendChild(script);
    document.body.appendChild(script);
  }

  var _load = function(dependencies, callback) {
    _completeCallback = callback;
    if (typeof dependencies !== 'undefined') {
      // Test and collect sources for loading
      for (var d in dependencies) {
        if (
          typeof (dependencies[d].test) === 'undefined' // check the method
          && typeof (dependencies[d].sources) === 'object' // must be an array
        ) {
          for (var s in dependencies[d].sources) {
            _scripts[_scripts.length] = dependencies[d].sources[s];
          }
        }
      }

      _numScripts = _scripts.length;

      for (var i = 0; i < _numScripts; i++) {
        _injectJs(_scripts[i], _onScriptLoaded);
      }

    } else {
      _completeCallback();
    }
  }

  // Public
  return (EcwidVkWidgets.extend(
    module,
    {
      load: _load
    }
  ));

})(EcwidVkWidgets.Loader || {});

/*
 * console wrapper
 */
EcwidVkWidgets.Console = (function(module) {
  // Private
  /*
  function _log() {
    
    for(var i=0; i<arguments.length; i++) s += arguments[i]

    console.log();
  } 
  */
})(EcwidVkWidgets.Console || {});

// Operating with page and Ecwid object
EcwidVkWidgets.EcwidApi = (function(module) {
  // Private
  
  // Truncate text in product description according to the given limits
  var _truncateProductDescription = function(text, length) {
    return ($.trim(text).substring(0, length).split(" ").slice(0, -1).join(" ") + "...");
  }

  //Parse the page source and get the product information
  var _getEcwidProductInfo = function() {
    var productInfo = {
      'imageUrl': $('.ecwid-productBrowser-details-thumbnail > img').attr('src'),
      'productTitle': $('.ecwid-productBrowser-head').text(),
      'productDescr': $('.ecwid-productBrowser-details-descr').text()
    };
    return productInfo;
  }

  var _attachProductPageLoadedHandler = function(callback) {
    //Ecwid.OnPageLoaded.add(func);
    Ecwid.OnPageLoaded.add(function(page) {
      if (
        typeof (page) == 'object'
        && 'PRODUCT' == page.type
      ) {
        callback();
      }
    });
  }

  // Public
  return (EcwidVkWidgets.extend(
    module,
    {
      attachProductPageLoadedHandler: _attachProductPageLoadedHandler,
      truncateProductDescription: _truncateProductDescription,
      getEcwidProductInfo: _getEcwidProductInfo
    }
  ));

})(EcwidVkWidgets.EcwidApi || {});


/*
 * Abstract Widget (as cached mixin)
 */
EcwidVkWidgets.Widget = (function(module) {

  module.createHTMLContainer = function() {
    // 'this' refers to child class
    $('#' + this.config.elmId).remove();
    $(this.config.elmParentSelector).append(
      "<div id='" + this.config.elmId + "' class='" + this.config.elmCssClass + "'></div>"
    ).show(); 
  }
 
  function mixin() { // dbg: rename and comment, try extend
    for (key in module) {
      if (module.hasOwnProperty(key)) {
        this[key] = module[key]; // dbg: reverse overriding
      }
    }
    return this;    
  }

  return mixin;
  
})(EcwidVkWidgets.Widget || {});

/*
 * Widgets factory
 */
EcwidVkWidgets.WidgetsFactory = (function(module) {
  function _createWidget(type, config) {
    if (typeof (type) !== 'string') {
      return false;
    } // dbg: check type of keys

    switch(type) {
      case 'like': // dbg: string constants
        return new EcwidVkWidgets.LikeWidget(config);
        break;

      case 'share':
        return new EcwidVkWidgets.ShareWidget(config);
        break;

      case 'comments':
        return new EcwidVkWidgets.CommentsWidget(config);
        break;

      default:
        return new EcwidVkWidgets.LikeWidget(config);
    }
  }

  return EcwidVkWidgets.extend(
    module,
    {
      createWidget: _createWidget
    }
  );

})(EcwidVkWidgets.WidgetsFactory || {});


/*
 * Like Widget (extends Widget)
 */
EcwidVkWidgets.LikeWidget = function(config) { // dbg: think about extending
  this.config = config;

  var that = this;
  this.show = function(productInfo, pageUrl) {
    that.createHTMLContainer();
    VK.Widgets.Like(
      that.config.elmId, 
      {
        type: that.config.type,
        width: that.config.width,
        pageTitle: productInfo.productTitle,
        pageDescription: EcwidVkWidgets.EcwidApi.truncateProductDescription(
          productInfo.productDescr, 
          that.config.shareTextMaxLength
        ),
        pageUrl: pageUrl,
        pageImage: productInfo.imageUrl,
        text: productInfo.productTitle,
        height: that.config.height,
        verb: that.config.verb
      }
    );
  }
}
EcwidVkWidgets.Widget.call(EcwidVkWidgets.LikeWidget.prototype);

/*
 * Share Widget (extends Widget)
 */
EcwidVkWidgets.ShareWidget = function(config) { // dbg: think about extending
  this.config = config;

  var that = this;
  this.show = function(productInfo, pageUrl) { // dbg: why not simple using like function a() {} ? 
    that.createHTMLContainer();
    $('#' + that.config.elmId).html(
      VK.Share.button({
        url: pageUrl,
        title: productInfo.productTitle,
        description: EcwidVkWidgets.EcwidApi.truncateProductDescription(
          productInfo.productDescr, 
          that.config.shareTextMaxLength
        ),
        image: productInfo.imageUrl,
        noparse: that.config.noparse
      })
    );
  }
}
EcwidVkWidgets.Widget.call(EcwidVkWidgets.ShareWidget.prototype);

/*
 * Comments Widget (extends Widget)
 */
EcwidVkWidgets.CommentsWidget = function(config) { // dbg: think about extending
  this.config = config;

  var that = this;
  this.show = function(productInfo, pageUrl) {
    that.createHTMLContainer();
    VK.Widgets.Comments(
      that.config.elmId, 
      {
        width: that.config.width,
        limit: that.config.limit,
        attach: that.config.attach,
        autoPublish: that.config.autoPublish,
        mini: that.config.mini,
        height: that.config.height,
        norealtime: that.config.norealtime,
        pageUrl: pageUrl
      }
    );
  }
}
EcwidVkWidgets.Widget.call(EcwidVkWidgets.CommentsWidget.prototype);
