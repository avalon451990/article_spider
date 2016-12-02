var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite') 

var url = "http://www.37zw.com/2/2052/";


function init() {
      requestData(url, "", function(html){
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
                  requestData(url, name, function(html){
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

function requestData(url, name, callback){
      var chunks = [];
      http.get(url, function (res) {
            res.on("data", function (chunk) {
                  chunks.push(chunk);
            });
            res.on("end", function () {
                  var html = iconv.decode(Buffer.concat(chunks), 'gbk');
                  html = cheerio.load(html);
                  callback(html);
            });
      });
}

init();