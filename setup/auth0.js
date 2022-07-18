/**
 * Required auth0 rule to get access token to work
 */
function enrichAccessToken(user, context, callback) {
  let accessTokenClaims = context.accessToken || {};
  const assignedRoles = (context.authorization || {}).roles;
  accessTokenClaims[`https://roles`] = assignedRoles;
  user.user_metadata = user.user_metadata || {};
  accessTokenClaims[`https://userId`] = user.user_metadata.id;
  accessTokenClaims[`https://verified`] = user.email_verified;
  context.accessToken = accessTokenClaims;
  return callback(null, user, context);
}