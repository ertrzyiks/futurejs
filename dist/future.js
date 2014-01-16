/**
 * Futurejs v0.2.2
 * https://github.com/ertrzyiks/futurejs
 *
 * Dart Future and Completer features ported to javascript.
 */
(function(){
	
	var root = this;
	
	var nextTick;
	
	//Prefer process.nextTick, than timeout on nodejs
	if ( typeof(process) != "undefined" && isFunction(process.nextTick))
	{
		nextTick = function( cb ){
			process.nextTick(cb);
		};
	}
	else
	{
		nextTick = function( cb ){
			setTimeout(cb, 0);
		};
	}
	
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
	 * @param {Object|Function} [value] Completion `data` or error object
	 * @param {boolean} [withError] 
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
	 * @param {Object} value
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
	 * @param {Function} value
	 * @return {Future}
	 * @static
	 */
	Future.sync = function( value )
	{
		if( !isFunction( value ) )
		{
			throw new Error("Future.sync value should be a function");
		}
		return new Future( value );
	}
	
	/**
	 * Create new `Future`, synchronously completed with error, `value` is used as error object.
	 *
	 * @method error
	 * @param {Object|Function} e
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
	 * @property {Boolean} _pending
	 * @private
	 */
	Future.prototype._pending = true;
	
	/**
	 * Hold completion `data`.
	 *
	 * @property {Object} _data
	 * @private
	 */
	Future.prototype._data = null;
	
	/**
	 * Hold completion error object.
	 *
	 * @property {Object} _error
	 * @private
	 */
	Future.prototype._error = null;
	
	/**
	 * Determine if completion was with error (true) or not (false)
	 *
	 * @property {Boolean} _withError
	 * @private
	 */
	Future.prototype._withError = false;
	
	/**
	 * Array of registered handlers for *then*, *whenComplete* and *catchError*
	 *
	 * @property {Array} _callbacks
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
	 * @param {Function} onValue Function which will be called after completion. It takes one parameter, completion `data`.
	 * @param {Object} [options] Map of optional parameters. Currently the only supported is { onError: {Function} }.
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
			}, true);
		}
		
		return future;
	};
	
	/**
	 * Add error handler into `Future` completion chain.
	 * 
	 * Result in `Future` which completes with `data` returned by handler.
	 *
	 * @method catchError
	 * @param {Function} onError Error handler
	 * @param {Function} [test] Callback which should return `true` if error is handler and new `data` is set for `Future`
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
	 * @param {Function} action Callback
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
	 * @param {Object} data Value for completion.
	 * @param {Boolean} [sync] Determine if future was completed in sync mode
	 * @private
	 */
	Future.prototype._complete = function( data, sync )
	{
		if( !this._pending )
		{
			throw new Error("Future already completed");
		}
		
		this._pending = false;
		this._data = data;
		
		this._dispatchCompletion( sync );
	};
	
	/**
	 * Update object state and trigger completion for registered callbacks.
	 *
	 * @method _innerComplete
	 * @param {Object} data Setting of handler { onValue: fn, onError: fn, f: Future }
	 * @param {Boolean} [sync] Determine if future was completed in sync mode
	 * @private
	 */
	Future.prototype._innerComplete = function( data, sync )
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
			data.f._completeError( e ,sync );
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
			data.f._complete( result, sync );
		}
	};
	
	/**
	 * Used by completer to control future.
	 *
	 * Complete task with error.
	 *
	 * @method _completeError
	 * @param {Object} error Error object.
	 * @param {Boolean} [sync] Determine if future was completed in sync mode
	 * @private
	 */
	Future.prototype._completeError = function( error, sync )
	{
		if( !this._pending )
		{
			throw new Error("Future already completed");
		}
		
		this._pending = false;
		this._withError = true;
		this._error = error;
		
		this._dispatchCompletion( sync );
	};
	
	/**
	 * Prepare for propagate completion to registered handlers. Decide which mode it should go:
	 * 
	 * normal, for sync != true
	 * fake-async, for sync == true
	 *
	 * @method _dispatchCompletion
	 * @param {Boolean} [sync] Determine if future was completed in sync mode
	 * @private
	 */
	Future.prototype._dispatchCompletion = function( sync )
	{
		if ( sync )
		{
			var self = this;
			self._pending = true;
			nextTick(function(){
				self._pending = false;
				self._actualDispatchCompletion( );
			});
		}
		else
		{
			this._actualDispatchCompletion();
		}
	};
	
	/**
	 * Propagate completion to registered handlers.
	 *
	 * @method _actualDispatchCompletion
	 * @private
	 */
	Future.prototype._actualDispatchCompletion = function(){
		var len = this._callbacks.length;
		
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
	 * @param {Array} list List of `Future`s to wait for
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
	 * @param {Array} list Input for iteration
	 * @param {Function} fn Function to call on each element. Should return `Future`
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
	 * @property {Future} future
	 */
	Completer.prototype.future = null;
	
	/**
	 * Complete assigned future with `data`.
	 * 
	 * @method complete
	 * @param {Object} data
	 */
	Completer.prototype.complete = function( data )
	{
		this.future._complete( data );
	};
	
	/**
	 * Complete assigned future with error. 
	 *
	 * @method completeError
	 * @param {Object} error
	 */
	Completer.prototype.completeError = function( error )
	{
		this.future._completeError( error );
	};
	
	/**
	 * Return `true` if object is completed with data or error, `false` otherwise.
	 *
	 * @method isCompleted
	 * @return {Boolean}
	 */
	Completer.prototype.isCompleted = function()
	{
		return !this.future._pending;
	};
	
	if ( typeof exports != 'undefined' ) 
	{
		module.exports.Future = Future;
		module.exports.Completer = Completer;
	}
	else if ( typeof define != 'undefined' )
	{
		define({
			Future: Future,
			Completer: Completer
		});
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