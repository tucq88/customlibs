/**
 * vouch.js to handle permission management
 *
 * //TODO(hoatle): move this to customlibs
 *
 * @author hoatle
 * @since  2014-05-24
 */
(function(_) {

  //Permission

  function Permission(spec) {
    this.initialize.apply(this, arguments);
  }

  _.extend(Permission.prototype, {

    initialize: function(spec) {
      this.spec = spec;
    },

    implies: function(permission) {
      //just very very simple spec comparison: one must match exactly one
      //TODO(hoatle): implement wildcard spec
      return this.equals(permission);
    },
    equals: function(permission) {
      return this.spec === permission.spec;
    }
  });

  //Subject

  function Subject() {
    this.initialize.apply(this, arguments);
  }

  _.extend(Subject.prototype, {

    initialize: function() {
      this.permissions = [];
    },

    setPermissions: function(permissions) {
      this.permissions = permissions;
    },

    addPermission: function(newPermission) {
      //TODO(hoatle): check existing?

      if (_.isString(newPermission)) {
        newPermission = new Permission(newPermission);
      }

      this.permissions.push(newPermission);
    },

    removePermission: function(existingPermission) {
      if (_.isString(existingPermission)) {
        existingPermission = new Permission(existingPermission);
      }

      this.permissions = _.filter(this.permissions, function(permission) {
        return !permission.equals(existingPermission)
      });
    },

    isPermitted: function(permission) {

      if (_.isString(permission)) {
        permission = new Permission(permission);
      }

      var permitted = false;

      for (var i = 0, len = this.permissions.length; i < len; i++) {
        permitted = this.permissions[i].implies(permission);
        if (permitted) {
          break;
        }
      }

      return permitted;
    }
  });


  //utility

  var subject;

  function getSubject() {
    if (!subject) {
      subject = new Subject();
    }
    return subject;
  }

  //expose
  window.vouch = window.vouch || {};

  window.vouch.Permission = Permission;
  window.vouch.Subject = Subject;
  window.vouch.getSubject = getSubject;

})(_);
