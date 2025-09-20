// Authorization utility functions

// User roles
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  TUTOR: 'tutor'
};

// Permission levels
export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE: 'manage'
};

// Role-based permissions
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    users: [PERMISSIONS.MANAGE],
    mathlab: [PERMISSIONS.MANAGE],
    settings: [PERMISSIONS.MANAGE],
    requests: [PERMISSIONS.MANAGE],
    sessions: [PERMISSIONS.MANAGE]
  },
  [ROLES.TEACHER]: {
    users: [PERMISSIONS.READ],
    mathlab: [PERMISSIONS.MANAGE],
    settings: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    requests: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    sessions: [PERMISSIONS.READ, PERMISSIONS.WRITE]
  },
  [ROLES.TUTOR]: {
    users: [PERMISSIONS.READ],
    mathlab: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    settings: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    requests: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    sessions: [PERMISSIONS.READ, PERMISSIONS.WRITE]
  },
  [ROLES.STUDENT]: {
    users: [PERMISSIONS.READ],
    mathlab: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    settings: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    requests: [PERMISSIONS.READ, PERMISSIONS.WRITE],
    sessions: [PERMISSIONS.READ]
  }
};

// Check if user has permission for a resource
export const hasPermission = (userRole, resource, permission) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return false;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions[resource]?.includes(permission) || false;
};

// Check if user can access a resource
export const canAccess = (userRole, resource) => {
  return hasPermission(userRole, resource, PERMISSIONS.READ);
};

// Check if user can modify a resource
export const canModify = (userRole, resource) => {
  return hasPermission(userRole, resource, PERMISSIONS.WRITE);
};

// Check if user can manage a resource
export const canManage = (userRole, resource) => {
  return hasPermission(userRole, resource, PERMISSIONS.MANAGE);
};

// Check if user is admin
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

// Check if user is teacher or admin
export const isTeacherOrAdmin = (userRole) => {
  return userRole === ROLES.TEACHER || userRole === ROLES.ADMIN;
};

// Check if user is tutor or higher
export const isTutorOrHigher = (userRole) => {
  return [ROLES.TUTOR, ROLES.TEACHER, ROLES.ADMIN].includes(userRole);
};

// Validate user action
export const validateUserAction = (userRole, action, resource) => {
  switch (action) {
    case 'read':
      return canAccess(userRole, resource);
    case 'write':
    case 'create':
    case 'update':
      return canModify(userRole, resource);
    case 'delete':
      return canManage(userRole, resource);
    default:
      return false;
  }
};

// Authorization middleware for components
export const withAuthorization = (Component, requiredPermission, resource) => {
  return function AuthorizedComponent(props) {
    const { userData } = props;
    
    if (!userData || !validateUserAction(userData.role, requiredPermission, resource)) {
      return (
        <div className="p-4 text-center">
          <p className="text-destructive">You don't have permission to access this resource.</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// Check if user can perform action on specific resource
export const canPerformAction = (userRole, action, resource, targetUserId = null) => {
  // Basic permission check
  if (!validateUserAction(userRole, action, resource)) {
    return false;
  }
  
  // Additional checks for user-specific resources
  if (resource === 'user' && targetUserId) {
    // Users can only modify their own data unless they're admin
    if (action === 'update' || action === 'delete') {
      return isAdmin(userRole) || userRole === ROLES.TEACHER;
    }
  }
  
  return true;
};
