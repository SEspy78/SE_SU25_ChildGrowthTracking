
import { useEffect, useState } from "react";
import { getUserInfo, type UserInfo } from "@/lib/storage";

const StaffManagement: React.FC = () =>{

const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const info = getUserInfo();
    console.log("userInfo:", info); // 🔍 kiểm tra ở đây
    setUser(info);
  }, []);

return (
<div>
    <h2>COn cac</h2>
</div>
    
)
}

export default StaffManagement;
