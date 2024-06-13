const constants = require("./../utils/constants");
const firebase = require("./../config/firebase");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
module.exports = async (req, res) => {
  if (req.headers.authorization == undefined) {
    req.headers[constants.user_id] = "";
    return false;
  } else {
    const idToken = req.headers.authorization;

    const firebaseConfig = await firebase.getConfig();

    let status = await firebaseConfig
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        const decodedId = decodedToken.uid;
        req.headers[constants.user_id] = decodedId;
        return true;
      })
      .catch((error) => {
        console.error(`ERROR::(${error.code})::${error.message}`);
        console.error(errorCodeMessage(error.code));
        return false;
      });
    return status;
  }
};

function errorCodeMessage(errCode) {
  switch (errCode) {
    case "auth/claims-too-large":
      return "The claims payload provided to setCustomUserClaims() exceeds the maximum allowed size of 1000 bytes.";
    case "auth/email-already-exists":
      return "The provided email is already in use by an existing user. Each user must have a unique email.";
    case "auth/id-token-expired":
      return "The provided Firebase ID token is expired.";
    case "auth/id-token-revoked":
      return "The Firebase ID token has been revoked.";
    case "auth/insufficient-permission":
      return "The credential used to initialize the Admin SDK has insufficient permission to access the requested Authentication resource. Refer to Set up a Firebase project for documentation on how to generate a credential with appropriate permissions and use it to authenticate the Admin SDKs.";
    case "auth/internal-error":
      return "The Authentication server encountered an unexpected error while trying to process the request. The error message should contain the response from the Authentication server containing additional information. If the error persists, please report the problem to our Bug Report support channel.";
    case "auth/invalid-argument":
      return "An invalid argument was provided to an Authentication method. The error message should contain additional information.";
    case "auth/invalid-claims":
      return "The custom claim attributes provided to setCustomUserClaims() are invalid.";
    case "auth/invalid-continue-uri":
      return "The continue URL must be a valid URL string.";
    case "auth/invalid-creation-time":
      return "The creation time must be a valid UTC date string.";
    case "auth/invalid-credential":
      return "The credential used to authenticate the Admin SDKs cannot be used to perform the desired action. Certain Authentication methods such as createCustomToken() and verifyIdToken() require the SDK to be initialized with a certificate credential as opposed to a refresh token or Application Default credential. See Initialize the SDK for documentation on how to authenticate the Admin SDKs with a certificate credential.";
    case "auth/invalid-disabled-field":
      return "The provided value for the disabled user property is invalid. It must be a boolean.";
    case "auth/invalid-display-name":
      return "The provided value for the displayName user property is invalid. It must be a non-empty string.";
    case "auth/invalid-dynamic-link-domain":
      return "The provided dynamic link domain is not configured or authorized for the current project.";
    case "auth/invalid-email":
      return "The provided value for the email user property is invalid. It must be a string email address.";
    case "auth/invalid-email-verified":
      return "The provided value for the emailVerified user property is invalid. It must be a boolean.";
    case "auth/invalid-hash-algorithm":
      return "The hash algorithm must match one of the strings in the list of supported algorithms.";
    case "auth/invalid-hash-block-size":
      return "The hash block size must be a valid number.";
    case "auth/invalid-hash-derived-key-length":
      return "The hash derived key length must be a valid number.";
    case "auth/invalid-hash-key":
      return "The hash key must a valid byte buffer.";
    case "auth/invalid-hash-memory-cost":
      return "The hash memory cost must be a valid number.";
    case "auth/invalid-hash-parallelization":
      return "The hash parallelization must be a valid number.";
    case "auth/invalid-hash-rounds":
      return "The hash rounds must be a valid number.";
    case "auth/invalid-hash-salt-separator":
      return "The hashing algorithm salt separator field must be a valid byte buffer.";
    case "auth/invalid-id-token":
      return "The provided ID token is not a valid Firebase ID token.";
    case "auth/invalid-last-sign-in-time":
      return "The last sign-in time must be a valid UTC date string.";
    case "auth/invalid-page-token":
      return "The provided next page token in listUsers() is invalid. It must be a valid non-empty string.";
    case "auth/invalid-password":
      return "The provided value for the password user property is invalid. It must be a string with at least six characters.";
    case "auth/invalid-password-hash":
      return "The password hash must be a valid byte buffer.";
    case "auth/invalid-password-salt":
      return "The password salt must be a valid byte buffer";
    case "auth/invalid-phone-number":
      return "The provided value for the phoneNumber is invalid. It must be a non-empty E.164 standard compliant identifier string.";
    case "auth/invalid-photo-url":
      return "The provided value for the photoURL user property is invalid. It must be a string URL.";
    case "auth/invalid-provider-data":
      return "The providerData must be a valid array of UserInfo objects.";
    case "auth/invalid-provider-id":
      return "The providerId must be a valid supported provider identifier string.";
    case "auth/invalid-oauth-responsetype":
      return "Only exactly one OAuth responseType should be set to true.";
    case "auth/invalid-session-cookie-duration":
      return "The session cookie duration must be a valid number in milliseconds between 5 minutes and 2 weeks.";
    case "auth/invalid-uid":
      return "The provided uid must be a non-empty string with at most 128 characters.";
    case "auth/invalid-user-import":
      return "The user record to import is invalid.";
    case "auth/maximum-user-count-exceeded":
      return "The maximum allowed number of users to import has been exceeded.";
    case "auth/missing-android-pkg-name":
      return "An Android Package Name must be provided if the Android App is required to be installed.";
    case "auth/missing-continue-uri":
      return "A valid continue URL must be provided in the request.";
    case "auth/missing-hash-algorithm":
      return "Importing users with password hashes requires that the hashing algorithm and its parameters be provided.";
    case "auth/missing-ios-bundle-id":
      return "The request is missing a Bundle ID.";
    case "auth/missing-uid":
      return "A uid identifier is required for the current operation.";
    case "auth/missing-oauth-client-secret":
      return "The OAuth configuration client secret is required to enable OIDC code flow.";
    case "auth/operation-not-allowed":
      return "The provided sign-in provider is disabled for your Firebase project. Enable it from the Sign-in Method section of the Firebase console.";
    case "auth/phone-number-already-exists":
      return "The provided phoneNumber is already in use by an existing user. Each user must have a unique phoneNumber.";
    case "auth/project-not-found":
      return "No Firebase project was found for the credential used to initialize the Admin SDKs. Refer to Set up a Firebase project for documentation on how to generate a credential for your project and use it to authenticate the Admin SDKs.";
    case "auth/reserved-claims":
      return "One or more custom user claims provided to setCustomUserClaims() are reserved. For example, OIDC specific claims such as (sub, iat, iss, exp, aud, auth_time, etc) should not be used as keys for custom claims.";
    case "auth/session-cookie-expired":
      return "The provided Firebase session cookie is expired.";
    case "auth/session-cookie-revoked":
      return "The Firebase session cookie has been revoked.";
    case "auth/uid-already-exists":
      return "The provided uid is already in use by an existing user. Each user must have a unique uid.";
    case "auth/unauthorized-continue-uri":
      return "The domain of the continue URL is not whitelisted. Whitelist the domain in the Firebase Console.";
    case "auth/user-not-found":
      return "There is no existing user record corresponding to the provided identifier. ";
  }
}
