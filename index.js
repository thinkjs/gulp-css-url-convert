// Generated by LiveScript 1.4.0
var path, rework, reworkUrl, through, isDataUrl, isNetworkUrl, isRelative, isAbsolute, isIgnore, urlMap, urlConvert, cssUrlConvert;
path = require('path');
rework = require('rework');
reworkUrl = require('rework-plugin-url');
through = require('through2');
/*
 * options
 *   root 根目录
 *   path 路径
 *   type 转换到relative相对路径，absolute约对路径，network网络路径
 *   map 从一个类型映射到另一个类型
 *   ignore 过滤
 *
 */
isDataUrl = function(url){
  return /^data:image/.exec(url);
};
isNetworkUrl = function(url){
  return /^http(?:s|):/.exec(url);
};
isRelative = function(url){
  return !/^\./.test(url) || !/^(http(?:s|):|data:|\/)/.test(url);
};
isAbsolute = function(url){
  return /^\//.exec(url);
};
isIgnore = function(url, rules){
  var i$, len$, key, rule;
  if (!rules) {
    return false;
  }
  if (!Array.isArray(rules)) {
    rules = [].concat(rules);
  }
  for (i$ = 0, len$ = rules.length; i$ < len$; ++i$) {
    key = i$;
    rule = rules[i$];
    if (typeof rule === 'string') {
      if (url === rule) {
        return false;
      }
    }
    if (typeof rule === 'object' && rule !== null && rule.constructor === RegExp) {
      if (rule.match(url) !== null) {
        return false;
      }
    }
  }
};
urlMap = function(url, maps){
  var i$, len$, key, map, mapMatch;
  if (!Array.isArray(maps)) {
    maps = [].concat(maps);
  }
  for (i$ = 0, len$ = maps.length; i$ < len$; ++i$) {
    key = i$;
    map = maps[i$];
    mapMatch = new RegExp("^" + key);
    if (reg.text(url) !== null) {
      return url.replace(mapMatch, map);
    }
  }
};
urlConvert = function(file, options){
  var cssPath, cssContent, replaceCount, urlReplace, newCssContent, e;
  cssPath = path.dirname(file.path);
  cssContent = file.contents.toString();
  replaceCount = 0;
  urlReplace = function(url){
    var baseName, urlPath, relativeUrlPath;
    if (isDataUrl(url)) {
      return url;
    }
    if (isIgnore(url, options.ignore)) {
      return url;
    }
    if (options.map) {
      url = urlMap(url, options.map);
    }
    if (options.type === 'network' || isNetworkUrl(options.path)) {
      if (isNetworkUrl(url)) {
        return url;
      }
      options.path = options.path.replace(/\/$/, '');
      if (isRelative(url)) {
        baseName = path.basename(url);
        urlPath = path.resolve(cssPath, path.dirname(url));
        relativeUrlPath = path.relative(options.root, urlPath);
        replaceCount += 1;
        return options.path + "/" + relativeUrlPath + "/" + baseName;
      } else if (isAbsolute(url)) {
        replaceCount += 1;
        return url.replace(/^\//, options.path);
      }
    } else if (options.type === 'absolute' || isAbsolute(options.path)) {
      if (isAbsolute(url) || isNetworkUrl(url)) {
        return url;
      }
      if (isRelative(url)) {
        baseName = path.basename(url);
        urlPath = path.resolve(cssPath, path.dirname(url));
        relativeUrlPath = path.relative(options.root, urlPath);
        replaceCount += 1;
        return options.path + "" + relativeUrlPath + "/" + baseName;
      }
    } else {
      return url;
    }
  };
  if (options.useRework) {
    try {
      newCssContent = rework(cssContent).use(reworkUrl(urlReplace)).toString();
    } catch (e$) {
      e = e$;
      console.error("css file: " + file.path);
      console.error(e.stack);
      throw new Error("rework error");
    }
  } else {
    try {
      newCssContent = cssContent.replace(/(url\(\s*['"]?)([^'"\)]*)(['"]?\s*\))/g, function(all, start, url, end){
        if (url.length) {
          url = urlReplace(url);
        }
        return start + "" + url + end;
      });
    } catch (e$) {}
  }
  if (replaceCount > 0) {
    return newCssContent;
  } else {
    return false;
  }
};
cssUrlConvert = function(options){
  options || (options = {});
  return through.obj(function(file, enc, cb){
    var cssContent;
    cssContent = urlConvert(file, options);
    if (cssContent) {
      file.contents = new Buffer(cssContent);
    }
    this.push(file);
    return cb();
  });
};
module.exports = cssUrlConvert;