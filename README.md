Futurejs
========

Dart Future and Completer feature ported to javascript for NodeJS and browser.

See API reference:
 * [Completer](https://api.dartlang.org/docs/channels/stable/latest/dart_async/Completer.html)
 * [Future](https://api.dartlang.org/docs/channels/stable/latest/dart_async/Future.html)


Features
-----

#### Apply to callback architecture

Completer allows you to change callbacks schema into Future flow.
````javascript
/**
 * Example 1
 * 
 * Change callbacks based API into Future based
 */
function asyncTask(){
  var completer = new Completer();

  task.on('success', function( data ){
    completer.complete(data);
  });
  
  task.on('error', function( e ){
    completer.completeError(e);
  });
  
  return completer.future;
}
````

#### Future chaining

With Futures you can process async task with friendly interface. No more difficult to trace callbacks tree.
````javascript
/**
 * Example 2
 * 
 * Load list of items and update header text.
 */
function loadData(){
  return asyncTask().then( function( rows ){
    //render table
  });
}

loadData().then( function( rows ){
  header1.text = "Loaded " + rows.length + " rows";
});


````

#### Data processing

It provide comfortable way to split processing of complex data.
````javascript
/**
 * Example 3
 * 
 * Load list of items and update header text using Future data chaining.
 */
function loadData(){
  return asyncTask().then( function( rows ){
    //render table
    return rows.length;
  });
}

loadData().then( function( rowsNum ){
  header1.text = "Loaded " + rowsNum + " rows";
});


````


TODO
---
 - Future.wait() function
 - Future.forEach() function
 - Future.delayed() function
 - clean callbacks array after completion

