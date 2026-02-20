import React from "react";

export default function Notifications() {
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: "Uus kasutaja registreerunud",
      message: "Kasutaja John Doe on registreerunud töötajana.",
      time: "2 tundi tagasi",
      type: "info",
    },
    {
      id: 2,
      title: "Kütuse tase madal",
      message: "Masina 508HVY kütuse tase on alla 20%.",
      time: "5 tundi tagasi",
      type: "warning",
    },
    {
      id: 3,
      title: "Töö lõpetatud",
      message: "Töötaja Jane Smith on lõpetanud päeva töö.",
      time: "1 päev tagasi",
      type: "success",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Teated</h1>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.type === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : notification.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <h3 className="font-semibold">{notification.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}