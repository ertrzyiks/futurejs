var assert = require("assert");

var Completer = require("../future").Completer;
var Future = require("../future").Future;

function emptyFn(){}

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
			
			assert.throws(function(){
				completer.completeError( new Error() );
			});
			
			completer.future.then(function( data ){}, function( e ){ 
				assert.strictEqual( true , e instanceof Error );
				done();
			});
		});
		
		it('allow to check completion', function( ){
			var completer = new Completer();
			assert.strictEqual( false, completer.isCompleted() );
			
			completer.complete( 1 );
			assert.strictEqual( true, completer.isCompleted() );
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
				})
				.then(function(data){
					assert.strictEqual( 1 , data );
					done();
				});
		});
		
		it('allow to chain futures with data', function( done ){
		
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
		
		it('allow to catch errors with onError callback', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.then(function( data ){
					assert.strictEqual( 1 , data );
					return data + 2;
				}, function(e){
					return 7;
				})
				.then(function(data){
					assert.strictEqual( 7 , data );
					done();
				});
		});
		
		it('allow to catch errors with separated call', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.then(function( data ){
					assert.strictEqual( 1 , data );
					return data + 2;
				})
				.catchError(function(e){
					return 7;
				})
				.then(function(data){
					assert.strictEqual( 7 , data );
					done();
				});
		});
		
		it('allow to catch specific errors with separated call', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.then(function( data ){
					assert.strictEqual( 1 , data );
					return data + 2;
				})
				.catchError(function(e){
					return 7;
				}, function(e){ return e instanceof Error; })
				.catchError(function(e){
					return 8;
				})
				.then(function(data){
					assert.strictEqual( 7 , data );
					done();
				});
		});
		
		it('allow to catch specific errors with separated call(2)', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.then(function( data ){
					assert.strictEqual( 1 , data );
					return data + 2;
				})
				.catchError(function(e){
					return 7;
				}, function(e){ return e instanceof Number; })
				.catchError(function(e){
					return 8;
				})
				.then(function(data){
					assert.strictEqual( 8 , data );
					done();
				});
		});
		
		it('allow to propagate error', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.then(function( data ){
					assert.fail( data, "not at all", "There should be no callback there" );
				})
				.then(function(data){
					assert.fail( data, "not at all", "There should be no callback there" );
				})
				.catchError(function(){
					done();
				});
		});
	});
	
	
	describe('#future-error', function(){
		it('throws uncatched errors', function( ){
			var completer = new Completer();
			
			completer.future
				.then(function( data ){
					assert.fail( data, "not at all", "There should be no callback there" );
				})
				.then(function(data){
					assert.fail( data, "not at all", "There should be no callback there" );
				});
			
			assert.throws(function(){
				completer.completeError( new Error() );
			});
		});
		
		it('throws uncatched errors', function( ){
			var completer = new Completer();
			
			completer.future
				.then(function( data ){
					assert.fail( data, "not at all", "There should be no callback there" );
				})
				.then(function(data){
					assert.fail( data, "not at all", "There should be no callback there" );
				})
				.catchError(function(data){
					//handled!
				});
			
			assert.doesNotThrow(function(){
				completer.completeError( new Error() );
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
		
		it('accept null or undefined onError', function( ){
			assert.doesNotThrow(function(){
				var completer = new Completer();
				
				completer.future.then(emptyFn, null);
			});
			
			assert.doesNotThrow(function(){
				var completer = new Completer(),
					undef;
				
				completer.future.then(emptyFn, undef);
			});
		});
		
		it('throws error when called with invalid *onError*', function( ){
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then(emptyFn, 1);
			});
			
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then(emptyFn, false);
			});
			
			assert.throws(function(){
				var completer = new Completer();
				
				completer.future.then(emptyFn, "siema");
			});
		});
	});
	
	describe('#whenComplete', function(){
		it('call action function on success', function( done ){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.whenComplete(function(){
					done();
				});
		});
		
		it('call action function on error', function(){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.whenComplete(function(){
					done();
				})
				.catchError(function(e){
					
				});
		});
	});
})