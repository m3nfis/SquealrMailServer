/*
list class - emailListItem
list container #mails .container

email obj  - emailItem
email container - mailModals

#emailId - the id
*/
var APP = {
	Controller : {
		init: function( options ){
			this.options  = options;
			this.inboxUrl = '/inbox/';
			this.tempaltes = {};
			this.tempaltes.listItem = $('#mailListItem');
			this.tempaltes.mailItem = $('#mailItem');
			if( $.cookie('squlear')  ){
				this.mail = $.cookie('squlear');
				this.setHeaderEmail(this.mail);
				this.getMails ( this.mail );
				$( this.options.input ).val(this.mail);
			}
			$( options.setemailBtn ).unbind('click').bind( 'click', this.handleSubmit );
			$( options.form ).submit( this.handleSubmit );
			
		},
		setHeaderEmail: function(email){
			$('.currEmail').text( ' ' + this.mail + '@squealr.com' );
		},
		handleSubmit : function(event){
			var $anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $($anchor.attr('href')).offset().top
			}, 1500, 'easeInOutExpo');
			event.preventDefault();
			APP.Controller.getNewEmail();
		},
		getNewEmail : function(){
			var email =  $( APP.Controller.options.input ).val();
			if ( email ){
				email = email.split('@')[0];
				$.cookie('squlear', email, { expires: 2,  path: '/', domain: 'squealr.com' });
				APP.Controller.mail = email;
				this.setHeaderEmail( email );
				APP.Controller.getMails( email );
			}
			return true;
		},
		setMail: function(mail){
			this.mail = mail;
		},
		getListItem : function(mail){
		
			var tmp = this.tempaltes.listItem.clone().html();
			tmp = tmp.replace( '{{$from}}', APP.Utils.formatFrom( mail.from[0] ) );
			tmp = tmp.replace( '{{$subject}}', mail.subject );
			tmp = tmp.replace( '{{$emailId}}', mail._id);
			tmp = tmp.replace( '{{$time}}',  APP.Utils.formatDate (new Date(mail.date) )  );
			
			return tmp;			
		},
		getMailItem : function(mail){
		
			var tmp = this.tempaltes.mailItem.clone().html();		
				var from =  mail.from[0].address + ( mail.from[0].name!='' ?  ' ('+ mail.from[0].name +')' : '' );
			tmp = tmp.replace( '{{$from}}', from );
			tmp = tmp.replace( '{{$to}}', mail.to[0].address );
			tmp = tmp.replace( '{{$subject}}', mail.subject );
			tmp = tmp.replace( '{{$emailId}}', mail._id);
			tmp = tmp.replace( '{{$time}}', new Date(mail.date) );
				//var iframe = '<iframe class="mIframe" id="iframe'+mail._id+'" frameborder="0" src="'+'/inbox/html/' + mail._id +'"></iframe>' ;
			tmp = tmp.replace( '{{$body}}', mail.html );
			return tmp;
			
		},
		getMails : function( mailAddr ){
			var URL = this.inboxUrl + mailAddr + '@squealr.com'
			$.ajax({   
				type: "GET",
				url: URL,
				dataType : 'json',
			})
			.done(function( mails ) {
				APP.Controller.parseMails( mails );
			})
			.fail(function(jqXHR, textStatus, errorThrown) { 
				console.warn( jqXHR, textStatus, errorThrown );
			});
		},		
		parseMails : function ( mails ){
			APP.View.removeItem( '*' );
			if ( mails.length ){
				for (var i = mails.length - 1; i >= 0; i--) {
					APP.View.addMailItem( this.getMailItem( mails[i] ) );
					APP.View.addListItem( this.getListItem( mails[i] ) );
					/*
					$( '#' + mails[i]._id ).on('show.bs.modal', function ( el ) {
						
						setTimeout(function(){
							var h = $('#mailModals').find('.in iframe')[0].contentWindow.document.body.offsetHeight + 20;
							$('#mailModals').find('.in iframe').height(h);
						}, 350);
					})*/
					
				}
			} else {
				var noData = $('#mailListNoData').clone().html();
				APP.View.addListItem( noData );
			}
		},
		
		
	},
  
	View : {
		mailContainer : $('#mailModals'),
		mailListH : $('.row.dividery'),
		
		addListItem : function ( mail ){
			this.mailListH.after( mail );
		},
		addMailItem : function ( mail ){
			this.mailContainer.append( mail );
			
		},
		removeItem : function( id ){
			if ( id == '*' ){
				$('.portfolio-item').parent().remove();
				this.mailContainer.empty();
				return true;
			}
			$('#'+id).remove();
			$('a[href="#'+id+'"]').closest('div.row').remove();
		}

	
	},
	WS: {
		init: function(){
			this.socket = io();
			this.socket.on('add-consumer',function(){
				console.log('got add-consumer');
				APP.WS.socket.emit('add-consumer', APP.Controller.mail+'@squealr.com' );
				console.log('sent add-consumer '+ APP.Controller.mail +'@squealr.com');
			});
			this.socket.on('email', function(msg){
				console.log(msg);
			});
		}
	},
	
	Utils : {
		calcHeight : function( el ){
			$(el).show();
			var h = $('html', el.contentDocument).height();
			console.log(h);
        },
		formatFrom: function ( from ){
			var name = '<span class="addressName">' + from.address.split('@')[0] + '</span>',
				host = '<span class="addressHost">' + '@'+from.address.split('@')[1] + '</span>';
			return name + host;
		},
		formatDate: function( dateObj ){
			var date = '<span class="recDate">' + dateObj.toLocaleDateString() + '</span>',
				time = '<span class="recTime">, ' + dateObj.toLocaleTimeString() + '</span>';
				
			return date  + time;
			
		}
	}
};


$(function() {
	
	APP.Controller.init({
		setemailBtn : '.setMailBtn',
		input : '#emailSetInupt',
		form : '.emailForm'
	});
});