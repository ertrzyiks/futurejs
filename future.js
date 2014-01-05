/**
 * Futurejs v{{VERSION}}
 * https://github.com/ertrzyiks/futurejs
 *
 * Dart Future and Completer features ported to javascript.
 */
(function(){
	
	var root = this;
	
	/**
	 * @class Future
	 * @constructor
	 * @param value {Object, Function}
	 * @param withError {boolean}
	 */
	var Future = function( value, withError )
	{ 
		if ( !isUndefined( value ) )
		{
			var v;
			if ( isFunction( value ) )
			{
				v = value();
			}
			else
			{
				v = value;
			}
			
			this._pending = false;
			if ( withError )
			{
				this._withError = true;
				this._error = v;
			}
			else
			{
				this._data = v;
			}
		}
		
		this._callbacks = [];
	};
	
	/**
	 * @constructor
	 * @param value {Object}
	 */
	Future.value = function( value )
	{
		return new Future( value );
	}
	
	/**
	 * @constructor
	 * @param value {Function}
	 */
	Future.sync = function( value )
	{
		return new Future( value );
	}
	
	/**
	 * @constructor
	 * @param value {Object, Function}
	 */
	Future.error = function( error )
	{
		return new Future( error, true );
	}
	
	/**
	 * @property _pending {boolean}
	 * @private
	 */
	Future.prototype._pending = true;
	
	/**
	 * @property _data {Object}
	 * @private
	 */
	Future.prototype._data = null;
	
	/**
	 * @property _error {Object}
	 * @private
	 */
	Future.prototype._error = null;
	
	/**
	 * @property _withError {boolean}
	 * @private
	 */
	Future.prototype._withError = false;
	
	/**
	 * @property _callbacks {Array}
	 * @private
	 */
	Future.prototype._callbacks = null;
	
	/**
	 * @method then
	 * @param onValue {Function}
	 * @param [options] {Object}
	 */
	Future.prototype.then = function( onValue, options )
	{
		if( !isFunction(onValue) )
		{
			throw new Error("onValue callback must be a function");
		}
		
		var onError = options;
		
		if( onError != null && !isUndefined(onError) && !isFunction(onError) )
		{
			options = options || {};
			onError = options.onError;
			
			if( !isFunction(onError) )
			{
				throw new Error("onError callback must be a function");
			}
		}
		
		var future = new Future();
		
		if ( this._pending )
		{
			this._callbacks.push( { 
				onValue: onValue,
				onError: onError,
				errorHandled: false,
				f: future
			} );
		}
		else
		{
			this._innerComplete( { 
				onValue: onValue,
				onError: onError,
				errorHandled: false,
				f: future
			} );
		}
		
		return future;
	};
	
	/**
	 * @method catchError
	 * @param onError {Function}
	 * @param [test] {Function}
	 */
	Future.prototype.catchError = function( onError, test )
	{
		return this.then( function(){}, function( e ){
			if( !test || test( e ) )
			{
				return onError( e );
			}
			
			throw e;
		});
	};
	
	/**
	 * @method whenComplete
	 * @param action {Function}
	 */
	Future.prototype.whenComplete = function( action )
	{
		return this.then(
			function( data ){
				var f2 = action();
				if ( f2 instanceof Future ) return f2.then(function(){ return data; });
				return data;
			}, 
			{ onError: function(e){
				var f2 = action();
				if ( f2 instanceof Future ) return f2.then( function(){ throw e; });
				throw e;
			} }
		);
	};
	
	/**
	 * @method _complete
	 * @private
	 */
	Future.prototype._complete = function( data )
	{
		if( !this._pending )
		{
			throw new Error("Future already completed");
		}
		
		this._pending = false;
		this._data = data;
		
		this._dispatchCompletion();
	};
	
	/**
	 * @method _innerComplete
	 * @private
	 */
	Future.prototype._innerComplete = function( data )
	{
		var result;
		try
		{
			if( this._withError )
			{
				if( !data.onError )
				{
					throw this._error;
				}
				result = data.onError( this._error );
			}
			else
			{
				result = data.onValue( this._data );
			}
		}
		catch( e )
		{
			data.f._completeError( e );
			return;
		}
		
		if ( isUndefined(result) )
		{
			result = this._data;
		}
		
		if ( result instanceof Future )
		{
			result
				.then(function( v ){
					data.f._complete( v );
				})
				.catchError(function( e ){
					data.f._completeError( e );
				});
		}
		else
		{
			data.f._complete( result );
		}
	};
	
	/**
	 * @method _completeError
	 * @private
	 */
	Future.prototype._completeError = function( error )
	{
		if( !this._pending )
		{
			throw new Error("Future already completed");
		}
		
		this._pending = false;
		this._withError = true;
		this._error = error;
		
		this._dispatchCompletion();
	};
	
	/**
	 * @method _dispatchCompletion
	 * @private
	 */
	Future.prototype._dispatchCompletion = function()
	{
		var len = this._callbacks.length, 
			errorHandled;
		
		if ( this._withError && len == 0 )
		{
			throw this._error;
		}
			
		for( var i = 0; i < len; i++ )
		{
			this._innerComplete( this._callbacks[i] );
		}
	};
	
	/**
	 *	@class Completer
	 *	@constructor
	 */
	var Completer = function()
	{ 
		this.future = new Future();
	};
	
	/**
	 * @property future
	 */
	Completer.prototype.future = null;
	
	/**
	 * @method complete
	 * @param data {Object}
	 */
	Completer.prototype.complete = function( data )
	{
		this.future._complete( data );
	};
	
	/**
	 * @method completeError
	 * @param error {Object}
	 */
	Completer.prototype.completeError = function( error )
	{
		this.future._completeError( error );
	};
	
	/**
	 * @method isCompleted
	 */
	Completer.prototype.isCompleted = function()
	{
		return !this.future._pending;
	};
	
	
	/**
	 * @method wait
	 * @static
	 */
	Future.wait = function( list ){
		if( !isArray( list ) )
		{
			throw new Error("List of futures to wait must be an array, " + list + " given");
		}
		
		if ( list.length == 0 )
		{
			return new Future.value([]);
		}
		
		var completer = new Completer(),
			pending = list.length,
			data = new Array( pending );
			
			
		function process(index){
			list[index].then(function(d){
				pending--;
				data[index] = d;
				
				if ( pending <= 0 )
				{
					completer.complete( data );
				}
			})
			.catchError(function(e){
				if ( !completer.isCompleted() )
				{
					completer.completeError( e );
				}
			});
		}
		
		for( var i = 0; i < list.length; i++ )
		{
			if ( list[i] instanceof Future )
			{
				process( i );
			}
			else
			{
				throw new Error( list[i] + " is not a Future");
			}
		}
		
		return completer.future;
	};
	
	/**
	 * @method forEach
	 * @static
	 */
	Future.forEach = function( list, fn ){
		var futures = [];
		
		for ( var i = 0; i < list.length; i++ ){
			var future = fn( list[i] );
			if ( !(future instanceof Future) )
			{
				throw new Error("Returned element " + list[i] + " is not a Future");
			}
			futures.push( future );
		}
		
		return this.wait(futures);
	};
	
	
	
	if (typeof exports !== 'undefined') 
	{
		module.exports.Future = Future;
		module.exports.Completer = Completer;
	} 
	else 
	{
		root.Future = Future;
		root.Completer = Completer;
	}
	
	function isUndefined(obj)
	{
		return typeof(obj) == "undefined";
	}
	
	function isFunction(obj) 
	{
		  return Object.prototype.toString.call(obj) == '[object Function]';
	}
	
	function isArray(obj){
		return Object.prototype.toString.call(obj) == '[object Array]';
	}
	
})();