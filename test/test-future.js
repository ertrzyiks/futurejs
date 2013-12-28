var assert = require("assert");

var Completer = require("../future").Completer;
var Future = require("../future").Future;

function emptyFn(){}
function neverCalledFn(){ assert.fail(null, null, "this function should never be called"); }

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
			}, { onError: neverCalledFn } );
		});
		
		it('inform future about completion with error', function( done ){
		
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error("MyCustomError") );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask().then( neverCalledFn, { onError: function( e ){ 
				assert.ok( e instanceof Error );
				assert.strictEqual( e.message, "MyCustomError" );
				done();
			}} );
		});
		
		it('inform future after completion with data', function( done ){
		
			var completer = new Completer();
			completer.complete( 1 );
			
			completer.future.then(function( data ){
				assert.strictEqual( 1 , data );
				done();
			}, { onError: neverCalledFn } );
		});
		
		it('inform future after completion with error', function( done ){
			var completer = new Completer();
			
			assert.throws(function(){
				completer.completeError( new Error("MyCustomError") );
			});
			
			completer.future.then(function( data ){}, function( e ){ 
				assert.ok( e instanceof Error );
				assert.strictEqual( e.message, "MyCustomError" );
				done();
			}, { onError: neverCalledFn });
		});
		
		it('allow to check completion', function( ){
			var completer = new Completer();
			assert.ok( !completer.isCompleted() );
			
			completer.complete( 1 );
			assert.ok( completer.isCompleted() );
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
				}, { onError: neverCalledFn })
				.then(function(data){
					assert.strictEqual( 1 , data );
					done();
				}, { onError: neverCalledFn });
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
				}, { onError: neverCalledFn })
				.then(function(data){
					assert.strictEqual( 3 , data );
					done();
				}, { onError: neverCalledFn });
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
				}, { onError: function(e){
					return 7;
				} } )
				.then(function(data){
					assert.strictEqual( 7 , data );
					done();
				}, { onError: neverCalledFn });
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
				}, { onError: neverCalledFn })
				.catchError(function(e){
					return 7;
				})
				.then(function(data){
					assert.strictEqual( 7 , data );
					done();
				}, { onError: neverCalledFn });
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
		
		it('allow to throw exception in error handler', function( ){
			var completer = new Completer();
			
			completer.future
				.then(function( data ){
					assert.fail( data, "not at all", "There should be no callback there" );
				})
				.catchError(function(e){
					throw e;
				})
				.catchError(function(e){
					//handled!
				});
			assert.doesNotThrow(function(){
				completer.completeError( new Error() );
			});
		});
		
		it('allow to return Future in callback to make middleware', function( done ){			
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			function asyncTask2( data ){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( data + 1 );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask().then(function( data ){
				assert.strictEqual(1, data);
				return asyncTask2( data );
			})
			.then(function( data ){
				assert.strictEqual(2, data);
				done();
			});
		});
		
		it('propagate error to parent Future', function( done ){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			function asyncTask2( data ){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask().then(function( data ){
				assert.strictEqual(1, data);
				return asyncTask2( data );
			})
			.then(neverCalledFn, function( e ){
				done();
			});
		});
	});
	
	
	describe('#future-sync', function(){
		it('allow to create sync futures with value', function( ){
			new Future.value( 5 ).then(function( data ){
				assert.strictEqual( 5, data );
			});
		});
		
		it('allow to create sync futures with function', function( ){
			new Future.sync( function(){ return 5; } ).then(function( data ){
				assert.strictEqual( 5, data );
			});
		});
		
		it('allow to create sync futures with error', function( ){
			new Future.error( new Error() ).catchError(function( e ){
				assert.ok( e instanceof Error );
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
			
			var counter = 0;
			
			asyncTask()
				.whenComplete(function(){
					counter++;
				})
				.then(function( data ){
					if( counter == 0 )
					{
						neverCalledFn();
					}
					done();
				});
		});
		
		it('call action function on success and does not change data', function( done ){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			asyncTask()
				.whenComplete(function(){
					return 2;
				})
				.then(function( data ){
					assert.strictEqual( 1, data );
					done();
				});
		});
		
		it('allow return Future in callback to make middleware', function( done ){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			function asyncTask2(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 2 );
				}, 100);
				
				return completer.future;
			}
			
			var counter = 0;
			
			asyncTask()
				.whenComplete(function(){
					return asyncTask2().then(function(){ counter++; });
				})
				.then(function( data ){
					assert.strictEqual( 1, data );
					assert.strictEqual( 1, counter, "It does not wait for completion of returned future" );
					done();
				});
		});
		
		it('call action function on error', function( done ){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error() );
				}, 100);
				
				return completer.future;
			}
			
			var counter = 0;
			
			asyncTask()
				.whenComplete(function(){
					counter++;
				})
				.catchError(function(e){
					if( counter == 0 )
					{
						neverCalledFn();
					}
					
					done();
				});
		});
		
		it('allow return Future in callback to make middleware on error', function( done ){
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error("MyCustomError") );
				}, 100);
				
				return completer.future;
			}
			
			function asyncTask2(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 2 );
				}, 100);
				
				return completer.future;
			}
			
			var counter = 0;
			
			asyncTask()
				.whenComplete(function(){
					return asyncTask2().then(function(){ counter++; });
				})
				.catchError(function( e ){
					assert.strictEqual( 1, counter, "It does not wait for completion of returned future" );
					assert.ok( e instanceof Error );
					assert.strictEqual( e.message, "MyCustomError");
					done();
				});
		});
	});
})