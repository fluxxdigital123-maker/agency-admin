import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Returns the current user's role + clientAccess (looked up by email in UserRole).
// If no UserRole record exists, defaults to OWNER (bootstrap: the account owner
// keeps full access until they assign roles to invited teammates).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await base44.asServiceRole.entities.UserRole.filter(
      { userEmail: user.email },
      "-created_date",
      5
    );
    if (rows && rows[0]) {
      return Response.json({
        role: rows[0].role,
        clientAccess: rows[0].clientAccess || [],
        userEmail: user.email,
      });
    }

    return Response.json({
      role: "OWNER",
      clientAccess: [],
      userEmail: user.email,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}