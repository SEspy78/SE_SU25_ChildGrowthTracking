// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
//   FacilityPaymentAccountApi,
//   type AllPaymentAccountResponse,
//   type PaymentAccount,
// } from "@/api/facilityPaymentAPI";
// import { Paperclip } from "lucide-react";
// import { getUserInfo } from "@/lib/storage";

// const PaymentAccountManagement: React.FC = () => {
//   const user = getUserInfo();
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
//   const [totalCount, setTotalCount] = useState(0);
//   const [pageIndex, setPageIndex] = useState(1);
//   const [pageSize] = useState(10);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [formData, setFormData] = useState<{
//     facilityId: number;
//     bankName: string;
//     accountNumber: string;
//     accountHolder: string;
//     QrcodeImage: File | null;
//     isActive: boolean;
//   }>({
//     facilityId: user?.facilityId || 0,
//     bankName: "",
//     accountNumber: "",
//     accountHolder: "",
//     QrcodeImage: null,
//     isActive: true,
//   });
//   const [message, setMessage] = useState<string | null>(null); // Thông báo bên ngoài
//   const [modalError, setModalError] = useState<string | null>(null); // Thông báo trong popup
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
//   const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
//   const popupRef = useRef<HTMLDivElement>(null);
//   const closeButtonRef = useRef<HTMLButtonElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     const fetchAccounts = async () => {
//       setLoading(true);
//       try {
//         if (!user?.facilityId) {
//           setError("Không tìm thấy ID cơ sở.");
//           return;
//         }
//         const response: AllPaymentAccountResponse = await FacilityPaymentAccountApi.getTrueAccount(user.facilityId);
//         setAccounts(response.data);
//         setTotalCount(response.totalCount);
//       } catch (err) {
//         setError("Không thể tải danh sách tài khoản.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAccounts();
//   }, [user?.facilityId]);

//   // Handle file input change
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       setFormData({ ...formData, QrcodeImage: event.target.files[0] });
//       setModalError(null); // Xóa lỗi khi chọn file mới
//     }
//   };

//   // Trigger file input click
//   const handleIconClick = () => {
//     fileInputRef.current?.click();
//   };

//   // Handle form input change
//   const handleInputChange = (
//     event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = event.target;

//     if (event.target instanceof HTMLInputElement) {
//       const { type, checked } = event.target;
//       setFormData((prev) => ({
//         ...prev,
//         [name]: type === "checkbox" ? checked : value,
//       }));
//     } else if (event.target instanceof HTMLSelectElement) {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value === "true",
//       }));
//     }
//     setModalError(null); // Xóa lỗi khi thay đổi input
//   };

//   // Handle form submission
//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();
//     setMessage(null); // Xóa thông báo bên ngoài trước khi submit
//     setModalError(null); // Xóa thông báo trong popup trước khi submit

//     if (!formData.QrcodeImage) {
//       setModalError("Vui lòng chọn file QR Code!");
//       return;
//     }

//     const formDataToSend = new FormData();
//     formDataToSend.append("facilityId", formData.facilityId.toString());
//     formDataToSend.append("bankName", formData.bankName);
//     formDataToSend.append("accountNumber", formData.accountNumber);
//     formDataToSend.append("accountHolder", formData.accountHolder);
//     formDataToSend.append("QrcodeImage", formData.QrcodeImage);
//     formDataToSend.append("isActive", formData.isActive.toString());

//     try {
//       for (let [key, value] of formDataToSend.entries()) {
//         console.log(`${key}:`, value);
//       }

//       await FacilityPaymentAccountApi.createAccount(formDataToSend);
//       setMessage("Tạo tài khoản thành công!"); // Hiển thị thông báo bên ngoài
//       setFormData({
//         facilityId: user?.facilityId || 0,
//         bankName: "",
//         accountNumber: "",
//         accountHolder: "",
//         QrcodeImage: null,
//         isActive: true,
//       });
//       setIsModalOpen(false); // Đóng modal khi thành công
//       const response: AllPaymentAccountResponse = await FacilityPaymentAccountApi.getTrueAccount(user?.facilityId || 0);
//       setAccounts(response.data);
//       setTotalCount(response.totalCount);
//     } catch (err) {
//       setModalError("Lỗi khi tạo tài khoản. Vui lòng kiểm tra file hoặc kết nối."); // Hiển thị thông báo trong popup
//       console.error("Error details:", err); // Log lỗi để debug
//     }
//   };

//   // Handle delete account
//   const handleDeleteAccount = async () => {
//     if (!accountToDelete) return;
//     try {
//       await FacilityPaymentAccountApi.deleteAccount(accountToDelete);
//       setMessage("Xóa tài khoản thành công!");
//       setIsDeleteConfirmOpen(false);
//       setAccountToDelete(null);
//       const response: AllPaymentAccountResponse = await FacilityPaymentAccountApi.getTrueAccount(user?.facilityId || 0);
//       setAccounts(response.data);
//       setTotalCount(response.totalCount);
//     } catch (err) {
//       setMessage("Lỗi khi xóa tài khoản.");
//     }
//   };

//   // Close modal
//   const closeModal = useCallback(() => {
//     setIsModalOpen(false);
//     setFormData({
//       facilityId: user?.facilityId || 0,
//       bankName: "",
//       accountNumber: "",
//       accountHolder: "",
//       QrcodeImage: null,
//       isActive: true,
//     });
//     setModalError(null); // Xóa lỗi khi đóng modal
//     setMessage(null); // Đảm bảo không giữ thông báo cũ
//   }, [user?.facilityId]);

//   // Close delete confirm
//   const closeDeleteConfirm = useCallback(() => {
//     setIsDeleteConfirmOpen(false);
//     setAccountToDelete(null);
//   }, []);

//   // Handle click outside and ESC key
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape" && isModalOpen) closeModal();
//       if (event.key === "Escape" && isDeleteConfirmOpen) closeDeleteConfirm();
//     };

//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         popupRef.current &&
//         !popupRef.current.contains(event.target as Node)
//       ) {
//         if (isModalOpen) closeModal();
//         if (isDeleteConfirmOpen) closeDeleteConfirm();
//       }
//     };

//     if (isModalOpen || isDeleteConfirmOpen) {
//       document.addEventListener("keydown", handleKeyDown);
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isModalOpen, closeModal, isDeleteConfirmOpen, closeDeleteConfirm]);

//   return (
//     <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
//     <div className="p-4 sm:p-8">
//       <div
//         className={`transition-all duration-300 ${
//           isModalOpen || isDeleteConfirmOpen ? "blur-sm" : ""
//         }`}
//       >
//         <h2 className="text-2xl font-bold mb-6">
//           Quản lý Tài khoản Thanh toán
//         </h2>
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg mb-4 transition-colors duration-200 cursor-pointer"
//           type="button"
//         >
//           Tạo Tài khoản
//         </button>
//         {loading ? (
//           <div>Loading...</div>
//         ) : error ? (
//           <div className="text-red-500">{error}</div>
//         ) : (
//           <table className="min-w-full bg-white rounded-xl shadow overflow-hidden mb-8">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-4 text-left">ID</th>
//                 <th className="p-4 text-left">Ngân hàng</th>
//                 <th className="p-4 text-left">Số TK</th>
//                 <th className="p-4 text-left">Chủ TK</th>
//                 <th className="p-4 text-left">QR Code</th>
//                 <th className="p-4 text-left">Trạng thái</th>
//                 <th className="p-4 text-left">Ngày tạo</th>
//                 <th className="p-4 text-left">Hành động</th>
//               </tr>
//             </thead>
//             <tbody>
//               {accounts.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="text-center py-8">
//                     Hiện chưa có tài khoản thanh toán nào
//                   </td>
//                 </tr>
//               ) : (
//                 accounts.map((account) => (
//                   <tr key={account.id} className="border-t hover:bg-gray-50">
//                     <td className="p-4 font-semibold">{account.id}</td>
//                     <td className="p-4">{account.bankName}</td>
//                     <td className="p-4">{account.accountNumber}</td>
//                     <td className="p-4">{account.accountHolder}</td>
//                     <td className="p-4">
//                       <a
//                         href={account.qrcodeImageUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-teal-600 hover:underline flex items-center"
//                       >
//                         <svg
//                           className="w-4 h-4 mr-1"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                           xmlns="http://www.w3.org/2000/svg"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth="2"
//                             d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
//                           />
//                         </svg>
//                         Xem QR
//                       </a>
//                     </td>
//                     <td className="p-4">
//                       <span
//                         className={
//                           account.isActive
//                             ? "text-green-600 font-medium"
//                             : "text-red-600 font-medium"
//                         }
//                       >
//                         {account.isActive ? "Hoạt động" : "Không hoạt động"}
//                       </span>
//                     </td>
//                     <td className="p-4">
//                       {new Date(account.createdAt).toLocaleDateString()}
//                     </td>
//                     <td className="p-4">
//                       <button
//                         className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200 cursor-pointer"
//                         onClick={() => {
//                           setAccountToDelete(account.id);
//                           setIsDeleteConfirmOpen(true);
//                         }}
//                       >
//                         Xóa
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         )}
//         <div className="mt-4 flex justify-center">
//           <button
//             onClick={() => setPageIndex(pageIndex - 1)}
//             disabled={pageIndex === 1}
//             className="px-4 py-2 bg-gray-300 rounded-md mr-2 disabled:opacity-50"
//           >
//             Trang trước
//           </button>
//           <span className="px-4 py-2">Trang {pageIndex}</span>
//           <button
//             onClick={() => setPageIndex(pageIndex + 1)}
//             disabled={pageIndex * pageSize >= totalCount}
//             className="px-4 py-2 bg-gray-300 rounded-md ml-2 disabled:opacity-50"
//           >
//             Trang sau
//           </button>
//         </div>
//         {message && (
//           <div
//             className={`mt-4 text-center text-sm ${
//               message.includes("thành công")
//                 ? "text-5xl font-bold text-emerald-600"
//                 : "text-5xl font-bold text-rose-500"
//             }`}
//           >
//             {message}
//           </div>
//         )}
//       </div>

//       {isModalOpen && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
//           role="dialog"
//           aria-modal="true"
//         >
//           <div
//             ref={popupRef}
//             role="dialog"
//             aria-labelledby="modal-title"
//             className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto mt-4 transition-all duration-300 transform translate-y-0 opacity-100 z-10 relative border border-gray-200"
//             style={{
//               animation: isModalOpen ? "slideIn 0.3s ease-out" : "none",
//             }}
//           >
//             <style>
//               {`
//                 @keyframes slideIn {
//                   from { transform: translateY(-20px); opacity: 0; }
//                   to { transform: translateY(0); opacity: 1; }
//                 }
//               `}
//             </style>
//             <div className="flex justify-between items-center mb-4">
//               <h3
//                 id="modal-title"
//                 className="text-xl sm:text-2xl font-semibold text-gray-800"
//               >
//                 Tạo Tài khoản Mới
//               </h3>
//               <button
//                 ref={closeButtonRef}
//                 className="text-gray-400 hover:text-gray-600 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
//                 onClick={closeModal}
//                 aria-label="Close modal"
//               >
//                 ×
//               </button>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Tên Ngân hàng:
//                 </label>
//                 <input
//                   type="text"
//                   name="bankName"
//                   value={formData.bankName}
//                   onChange={handleInputChange}
//                   className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Số Tài khoản:
//                 </label>
//                 <input
//                   type="text"
//                   name="accountNumber"
//                   value={formData.accountNumber}
//                   onChange={handleInputChange}
//                   className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Chủ Tài khoản:
//                 </label>
//                 <input
//                   type="text"
//                   name="accountHolder"
//                   value={formData.accountHolder}
//                   onChange={handleInputChange}
//                   className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   QR Code Image:
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="file"
//                     ref={fileInputRef}
//                     onChange={handleFileChange}
//                     className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 opacity-0 absolute h-10 cursor-pointer"
//                     required
//                     style={{ zIndex: -1 }}
//                   />
//                   <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
//                     <span className="flex-1 text-gray-500">
//                       {formData.QrcodeImage
//                         ? formData.QrcodeImage.name
//                         : "Chưa chọn file"}
//                     </span>
//                     <Paperclip
//                       className="ml-2 w-6 h-6 text-teal-600 hover:text-teal-800 cursor-pointer"
//                       onClick={handleIconClick}
//                       aria-label="Chọn file"
//                     />
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Trạng thái:
//                 </label>
//                 <select
//                   name="isActive"
//                   value={formData.isActive.toString()}
//                   onChange={handleInputChange}
//                   className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//                 >
//                   <option value="true">Hoạt động</option>
//                   <option value="false">Không hoạt động</option>
//                 </select>
//               </div>
//               {modalError && (
//                 <div className="text-rose-500 text-sm mt-2">{modalError}</div>
//               )}
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
//                 >
//                   Tạo Tài khoản
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {isDeleteConfirmOpen && accountToDelete && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
//           role="dialog"
//           aria-modal="true"
//         >
//           <div
//             ref={popupRef}
//             role="dialog"
//             aria-labelledby="delete-title"
//             className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-md mx-auto mt-4 transition-all duration-300 transform translate-y-0 opacity-100 z-10 relative border border-gray-200"
//             style={{
//               animation: isDeleteConfirmOpen ? "slideIn 0.3s ease-out" : "none",
//             }}
//           >
//             <style>
//               {`
//                 @keyframes slideIn {
//                   from { transform: translateY(-20px); opacity: 0; }
//                   to { transform: translateY(0); opacity: 1; }
//                 }
//               `}
//             </style>
//             <div className="flex justify-between items-center mb-4">
//               <h3
//                 id="delete-title"
//                 className="text-xl sm:text-2xl font-semibold text-gray-800"
//               >
//                 Xác nhận xóa
//               </h3>
//               <button
//                 ref={closeButtonRef}
//                 className="text-gray-400 hover:text-gray-600 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
//                 onClick={closeDeleteConfirm}
//                 aria-label="Close delete confirmation"
//               >
//                 ×
//               </button>
//             </div>
//             <p className="mb-4 text-gray-700">
//               Bạn có chắc chắn muốn xóa tài khoản này?
//             </p>
//             <div className="flex justify-end gap-2">
//               <button
//                 type="button"
//                 onClick={closeDeleteConfirm}
//                 className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
//               >
//                 Hủy
//               </button>
//               <button
//                 type="button"
//                 onClick={handleDeleteAccount}
//                 className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
//               >
//                 Xóa
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//     </div>
//   );
// };
// export default PaymentAccountManagement;