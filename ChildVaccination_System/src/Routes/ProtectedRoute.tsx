import { Navigate } from "react-router-dom"
import { getItemWithExpiry } from "@/lib/storage"

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  allowedPositions?: string[]; 
}

const ProtectedRoute = ({ children, allowedRoles, allowedPositions }: ProtectedRouteProps) => {
  const userInfo = getItemWithExpiry("userInfo")

  if (!userInfo) {
    return <Navigate to="/login" replace />
  }

  let parsedUser
  try {
    parsedUser = typeof userInfo === "string" ? JSON.parse(userInfo) : userInfo
  } catch {
    return <Navigate to="/login" replace />
  }

  const userRole = parsedUser?.role
  const userPosition = parsedUser?.position

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (allowedPositions && !allowedPositions.includes(userPosition)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute