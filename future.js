/**
 * Futurejs v{{VERSION}}
 * https://github.com/ertrzyiks/futurejs
 *
 * Dart Future and Completer features ported to javascript.
 */
(function(){
	
	var root = this;
	
	/**
	 *	@class Future
	 *	@constructor
	 */
	var Future = function(){ 
		this._callbacks = [];
	};
	
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
	 * @param [onError] {Function}
	 */
	Future.prototype.then = function( onValue, onError ){
		if( !isFunction(onValue) )
		{
			throw new Error("onValue callback must be a function");
		}
		
		if( onError != null && !isUndefined(onError) && !isFunction(onError) )
		{
			throw new Error("onError callback must be a function");
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
	Future.prototype.catchError = function( onError, test ){
		return this.then( function(){}, function( e ){
			if( !test || test( e ) )
			{
				return onError( e );
			}
			
			throw e;
		});
	};
	
	/**
	 * @method _complete
	 * @private
	 */
	Future.prototype._complete = function( data ){
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
	Future.prototype._innerComplete = function( data ){
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
		
		data.f._complete( result );
	};
	
	/**
	 * @method _completeError
	 * @private
	 */
	Future.prototype._completeError = function( error ){
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
	 *
	 */
	Future.prototype._dispatchCompletion = function(){
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
	var Completer = function(){ 
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
	Completer.prototype.complete = function( data ){
		this.future._complete( data );
	};
	
	/**
	 * @method completeError
	 * @param error {Object}
	 */
	Completer.prototype.completeError = function( error ){
		this.future._completeError( error );
	};
	
	
	
	if (typeof exports !== 'undefined') {
		module.exports.Future = Future;
		module.exports.Completer = Completer;
	} 
	else {
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
	
})();