var assert = require("assert");

var Completer = require("../future").Completer;
var Future = require("../future").Future;

function isBrowser()
{
	return ( typeof window != "undefined" );
}

describe('Future', function(){
	
	describe('#wait throwing exception', function(){
		it('throws error if completer throws error in sync', function( done ){
			if ( !isBrowser() ) return done();
			
			window.onerror = function( message ){
				window.onerror = null;
				done();
				return false;
			};
			
			var future1 = Future.wait( [ Future.value(1) ] );
			
			Future.wait( [ future1 ] )
				.then(function(){ throw "an unique error"; });
		});
	});
})