// import { Navigate } from "react-router-dom"
// import { getItemWithExpiry } from "@/lib/storage"

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles: string[];
//   allowedPositions?: string[]; 
// }

// const ProtectedRoute = ({ children, allowedRoles, allowedPositions }: ProtectedRouteProps) => {
//   const userInfo = getItemWithExpiry("userInfo")

//   if (!userInfo) {
//     return <Navigate to="/login" replace />
//   }

//   let parsedUser
//   try {
//     parsedUser = typeof userInfo === "string" ? JSON.parse(userInfo) : userInfo
//   } catch {
//     return <Navigate to="/login" replace />
//   }

//   const userRole = parsedUser?.role
//   const userPosition = parsedUser?.position

//   if (!allowedRoles.includes(userRole)) {
//     return <Navigate to="/unauthorized" replace />
//   }

//   if (allowedPositions && !allowedPositions.includes(userPosition)) {
//     return <Navigate to="/unauthorized" replace />
//   }

//   return <>{children}</>
// }

// export default ProtectedRoute


import { Navigate } from "react-router-dom"
import { useAuth } from "@/Hooks/useAuth"
import { Spin } from "antd"

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  allowedPositions?: string[]; 
}

const ProtectedRoute = ({ children, allowedRoles, allowedPositions }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = user.role
  const userPosition = user.position

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (allowedPositions && userPosition && !allowedPositions.includes(userPosition)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute