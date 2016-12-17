var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite') 

var search_url = "http://so.37zw.com/cse/search?click=1&s=2041213923836881982&q=";
// var url = "http://www.37zw.com/2/2052/";

function searchByBookName(book_name, callback) {
      if (!book_name || book_name == "") {
            console.log("please input bookname!");
            return;
      }
      //检测书名之中是否含有汉字
      var reg = new RegExp(/[\u4E00-\u9FA5]/g)
      if (!reg.test(book_name)) {
            console.log("the book name is not correct!");
            return;
      }
      //注意这里必须将书名进行一次url编码转换
      var fullSearchUrl = search_url + encodeURIComponent(book_name);
      requestData(fullSearchUrl, function (html) {
            var find_book = false;
            var searchList = html("a[class=result-game-item-title-link]");
            searchList.each(function (item) {
                  var result = html(this);
                  var title = result.attr('title')
                  // console.log(title + ":"+book_name);
                  if (title == book_name) {
                        find_book = true;
                        var result_url = result.attr('href');
                        callback(result_url);
                        return false;
                  }
            })
            if (!find_book) {
                  console.log("not find the book named:"+book_name);
            }
      }, true)
}

function init(url) {
      requestData(url, function(html){
            var file_name = html("h1", "#info").text();
            console.log(file_name);
            var sub_item_list = [];
            var node_list = html("dd");
            node_list.each(function (item) {
                  var cap = html(this).find("a");
                  sub_item_list.push({
                        name: cap.text(),
                        url: url + cap.attr('href')});
            });
            wraperContent(sub_item_list, file_name);
      });
}

function wraperContent(list, file_name){
      var contentStr = "";
      var index = 0;
      var nextTxt = function(){
            if (index < list.length) {
                  var item = list[index];
                  var name = item.name;
                  var url = item.url;
                  console.log(name);
                  requestData(url, function(html){
                        var content = html("div[id=content]");
                        var txt = content.text()+"\r\n";
                        txt = txt.replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, "");
                        txt = txt.replace(/\s{4}/g, "\r\n");
                        txt = txt.replace(/\n.*三七中文.*\r/g, "");
                        contentStr = contentStr + "\n\n" + name + "\n\n" + txt;
                        index = index + 1;
                        nextTxt();
                  });
            }else{
                  fs.writeFile(file_name + ".txt", contentStr);
            }
      }
      nextTxt();
}

function requestData(url, callback, isUTF8){
      var chunks = [];
      var html = "";
      http.get(url, function (res) {
            if (isUTF8) {
                  res.setEncoding('utf8'); 
            }
            res.on("data", function (chunk) {
                  chunks.push(chunk);
                  html = html + chunk;
            });
            res.on("end", function () {
                  if (!isUTF8) {
                        html = iconv.decode(Buffer.concat(chunks), 'gbk');
                  }
                  html = cheerio.load(html);
                  callback(html);
            });
      });
}

searchByBookName(process.argv[2], function (url) {
      init(url);
})