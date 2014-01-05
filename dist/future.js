/**
 * Futurejs v0.2.0
 * https://github.com/ertrzyiks/futurejs
 *
 * Dart Future and Completer features ported to javascript.
 */
(function(){
	
	var root = this;
	
	/**
	 * `Future` is representation of asynchronous task.
	 *
	 * By default creates new instance of uncompleted `Future`.
	 *
	 * When `value` is given, creates a completed Future with `data` equals to:
	 * - `value()` , when `value` is function
	 * - `value` , otherwise
	 *
	 * When `withError` parameter is passed and can be treat as true, then new object is completed with error. 
	 * In this case, value is used as error object.
	 *
	 * For convenience and API compatibility there are 3 shortcuts for creating synchronous `Future`s.
	 *
	 * - `Future.value( value )`
	 * - `Future.sync( fn )`
	 * - `Future.error( e )`
	 *
	 * @class Future
	 * @constructor
	 * @param value {Object, Function} Completion `data` or error object
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
	 * Create new `Future`, synchronously completed with `value`.
	 * 
	 * @method value 
	 * @param value {Object}
	 * @return {Future}
	 * @static
	 */
	Future.value = function( value )
	{
		return new Future( value );
	}
	
	/**
	 * Create new `Future`, synchronously completed with result of `value` function.
	 *
	 * @method sync
	 * @param value {Function}
	 * @return {Future}
	 * @static
	 */
	Future.sync = function( value )
	{
		if( !isFunction() )
		{
			throw new Error("Future.sync value should be a function");
		}
		return new Future( value );
	}
	
	/**
	 * Create new `Future`, synchronously completed with error, `value` is used as error object.
	 *
	 * @method error
	 * @param e {Object, Function}
	 * @return {Future}
	 * @static
	 */
	Future.error = function( e )
	{
		return new Future( e, true );
	}
	
	/**
	 * Determine if `Future` is completed (false) or not (true).
	 *
	 * @property _pending {boolean}
	 * @private
	 */
	Future.prototype._pending = true;
	
	/**
	 * Hold completion `data`.
	 *
	 * @property _data {Object}
	 * @private
	 */
	Future.prototype._data = null;
	
	/**
	 * Hold completion error object.
	 *
	 * @property _error {Object}
	 * @private
	 */
	Future.prototype._error = null;
	
	/**
	 * Determine if completion was with error (true) or not (false)
	 *
	 * @property _withError {boolean}
	 * @private
	 */
	Future.prototype._withError = false;
	
	/**
	 * Array of registered handlers for *then*, *whenComplete* and *catchError*
	 *
	 * @property _callbacks {Array}
	 * @private
	 */
	Future.prototype._callbacks = null;
	
	/**
	 * Add *onValue* handler to completion of `Future`. 
	 * If `Future` is already completed, handler is called synchronously, 
	 * otherwise its called just after completion.
	 *
	 * This handler can return new `data`, 
	 * `Future` which will be chained into process or nothing to keep original value.
	 *
	 * Optionally you can pass onError callback, which is inline version  of *catchError*.
	 *
	 * Any error in *onValue* callback leads to complete result `Future` with error.
	 * 
	 * @method then
	 * @param onValue {Function} Function which will be called after completion. It takes one parameter, completion `data`.
	 * @param [options] {Object} Map of optional parameters. Currently the only supported is { onError: {Function} }.
	 * @return {Future}
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
				f: future
			} );
		}
		else
		{
			this._innerComplete( { 
				onValue: onValue,
				onError: onError,
				f: future
			} );
		}
		
		return future;
	};
	
	/**
	 * Add error handler into `Future` completion chain.
	 * 
	 * Result in `Future` which completes with `data` returned by handler.
	 *
	 * @method catchError
	 * @param onError {Function} Error handler
	 * @param [test] {Function} Callback which should return `true` if error is handler and new `data` is set for `Future`
	 * @return {Future}
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
	 * Add callback which is called on success or error.
	 *
	 * Callback can return `Future` to chain async task in the process.
	 *
	 * @method whenComplete
	 * @param action {Function} Callback
	 * @return {Future} 
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
	 * Used by completer to control future.
	 * 
	 * Complete task with data.
	 *
	 * @method _complete
	 * @param data {Object} Value for completion.
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
	 * Update object state and trigger completion for registered callbacks.
	 *
	 * @method _innerComplete
	 * @param data {Object} Setting of handler { onValue: fn, onError: fn, f: Future }
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
	 * Used by completer to control future.
	 *
	 * Complete task with error.
	 *
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
	 * Propagate completion to registered handlers.
	 *
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
	 * Create `Future` when completes when all given `Future`s complete.
	 *
	 * When one or more input `Future`s completes with error, result `Future` result in error as well.
	 * 
	 * @method wait
	 * @param list {Array} List of `Future`s to wait for
	 * @return {Future} Gathering object
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
	 * Perform asynchronous task on list of elements.
	 *
	 * @method forEach
	 * @param list {Array} Input for iteration
	 * @param fn {Function} Function to call on each element. Should return `Future`
	 * @return {Future} `Future` which completes when all async task complete.
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
	
	/**
	 * `Completer` represents controller of asynchronous task.
	 * 
	 *	@class Completer
	 *	@constructor
	 */
	var Completer = function()
	{ 
		this.future = new Future();
	};
	
	/**
	 * `Future` object assigned to this completer
	 *
	 * @property future {Future}
	 */
	Completer.prototype.future = null;
	
	/**
	 * Complete assigned future with `data`.
	 * 
	 * @method complete
	 * @param data {Object}
	 */
	Completer.prototype.complete = function( data )
	{
		this.future._complete( data );
	};
	
	/**
	 * Complete assigned future with error. 
	 *
	 * @method completeError
	 * @param error {Object}
	 */
	Completer.prototype.completeError = function( error )
	{
		this.future._completeError( error );
	};
	
	/**
	 * Return `true` if object is completed with data or error, `false` otherwise.
	 *
	 * @method isCompleted
	 * @return {boolean}
	 */
	Completer.prototype.isCompleted = function()
	{
		return !this.future._pending;
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