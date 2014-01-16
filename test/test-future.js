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
				.then(neverCalledFn)
				.then(neverCalledFn);
			
			assert.throws(function(){
				completer.completeError( new Error() );
			});
		});
		
		it('allow to throw exception in error handler', function( ){
			var completer = new Completer(),
				counter = 0;
			
			completer.future
				.then(neverCalledFn)
				.catchError(function(e){
					throw e;
				})
				.catchError(function(e){
					//handled!
					counter = 1;
				});
			assert.doesNotThrow(function(){
				completer.completeError( new Error() );
				assert.ok( counter );
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
		
		
		it('allow to catch error from `then`', function( done ){
			var counter = 0;
						
			function asyncTask(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( 1 );
				}, 100);
				
				return completer.future;
			}
			
			function next(){
				assert.strictEqual( 1, counter );
				done();
			}
			asyncTask()
				.then(function(){ throw "an error"; })
				.catchError(function(){ counter++; next();});
		});
		
		it('allow to catch error from `then` sync', function( done ){
			Future.value(1)
				.then(function(){ throw "an error"; })
				.catchError(function(){ done(); });
		});
	});
	
	
	describe('#future-sync', function(){
		it('allow to create sync futures with value', function( ){
			Future.value( 5 ).then(function( data ){
				assert.strictEqual( 5, data );
			});
		});
		
		it('allow to create sync futures with function', function( ){
			Future.sync( function(){ return 5; } ).then(function( data ){
				assert.strictEqual( 5, data );
			});
		});
		
		it('allow to create sync futures with error', function( ){
			Future.error( new Error() ).catchError(function( e ){
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
	
	describe('#wait', function(){
		it('return future with complete after all futures complets', function( done ){
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
			
			var tasks = [];
			tasks.push( asyncTask() );
			tasks.push( asyncTask2() );
			
			Future.wait(tasks)
				.then(function( data ){
					assert.ok( data.length );
					assert.strictEqual( data[0], 1 );
					assert.strictEqual( data[1], 2 );
					done();
				})
				.catchError( neverCalledFn );
		});
		
		it('complete with error if one of future completes with error', function( done ){
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
					completer.completeError( new Error("MyError") );
				}, 100);
				
				return completer.future;
			}
			
			function asyncTask3(){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.completeError( new Error("MyTooLateError") );
				}, 200);
				
				return completer.future;
			}
			
			var tasks = [];
			tasks.push( asyncTask() );
			tasks.push( asyncTask2() );
			tasks.push( asyncTask3() );
			
			Future.wait(tasks)
				.then( neverCalledFn )
				.catchError( function( e ){ 
					assert.ok( e instanceof Error );
					assert.strictEqual( e.message, "MyError");
					done();
				});
		});
		
		it('empty list completes immediately', function( done ){
				Future.wait( [] ).then( function(data){
					assert.strictEqual( data.length, 0 );
					done();
				});
		});
		
		it('throws error when list is not array', function( ){
			assert.throws(function(){
				Future.wait( 1 );
			});
			
			assert.throws(function(){
				Future.wait( "test" );
			});
			
			assert.throws(function(){
				Future.wait( true );
			});
		});
		
		it('throws error when any of element on list is not a Future', function( ){
			assert.throws(function(){
				Future.wait( [ 1 ] );
			});
		});
		
		it('throws error if completer throws error', function( done ){
			function asyncTask( number){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( number * number );
				}, 100);
				
				return completer.future;
			}
			
			var counter = 0,
				future1 = Future.wait( [ asyncTask() ] );
			
			Future.wait( [ future1 ] )
				.then(function(){ throw "an error"; })
				.catchError(function(){ 
					counter++; 
					assert.strictEqual( 1, counter ); 
					done();
				});
		});
		
		it('throws error if completer throws error in sync', function( done ){
			var future1 = Future.wait( [ Future.value(1) ] );
			
			Future.wait( [ future1 ] )
				.then(function(){ throw "an error"; })
				.catchError(function(){ 
					done();
				});
		});
	});
	
	
	describe('#forEach', function(){
		it('iterates through async tasks', function( done ){
			
			function asyncTask( number){
				var completer = new Completer();
				
				setTimeout(function(){
					completer.complete( number * number );
				}, 100);
				
				return completer.future;
			}
			
			Future.forEach([1, 2, 3], function( el ){
				return asyncTask( el );
			})
			.then(function(data){
				assert.strictEqual( data.length, 3);
				assert.strictEqual( data[0], 1);
				assert.strictEqual( data[1], 2*2);
				assert.strictEqual( data[2], 3*3);
				done();
			});
		});
	});
})