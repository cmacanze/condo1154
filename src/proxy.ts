import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login"];
const adminRoutes = [
  "/apartments",
  "/residents",
  "/charges",
  "/payments",
  "/expenses",
  "/security",
  "/reports",
  "/audit",
  "/settings",
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

const isAdminRoute = adminRoutes.some((r) =>
    nextUrl.pathname.startsWith(r)
  );

  if (isAdminRoute && session?.user.role === "resident") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
