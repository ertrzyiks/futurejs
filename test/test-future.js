var assert = require("assert");

var Completer = require("../future").Completer;
var Future = require("../future").Future;

describe('Future', function(){
	describe('#completer', function(){
		it('inform future about completion with data', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask().then(function( data ){
				assert.strictEqual( 1 , data );
				done();
			});
		});
		
		it('inform future about completion with error', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask().then(function( data ){}, function( e ){ 
				assert.strictEqual( true , e instanceof Error );
				done();
			});
		});
		
		it('inform future after completion with data', function( done ){
		
			var completer = new Completer();
			completer.complete( 1 );
			
			completer.future.then(function( data ){
				assert.strictEqual( 1 , data );
				done();
			});
		});
		
		it('inform future after completion with error', function( done ){
			var completer = new Completer();
			completer.completeError( new Error() );
			
			completer.future.then(function( data ){}, function( e ){ 
				assert.strictEqual( true , e instanceof Error );
				done();
			});
		});
	});
	
	describe('#future', function(){
		it('allow to chain futures', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.then(function( data ){
					assert.strictEqual( 1 , data );
					return data + 2;
				})
				.then(function(data){
					assert.strictEqual( 3 , data );
					done();
				});
		});
	});
	
	describe('#then', function(){
		it('throws error when called without *onValue*', function( ){
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then();
			});
			
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then(1);
			});
			
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then(true);
			});
			
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then("siema");
			});
		});
	});
})