import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Input, Radio } from 'antd';
import axios from 'axios';

const PostponeAppointment = () => {
  const [username, setUsername] = useState('');
  const [userIdLine, setUserIdLine] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAppointments, setNewAppointments] = useState([]);
  const { appointId } = useParams();
  const navigate = useNavigate();
  const [appointmentCounts, setAppointmentCounts] = useState([]);

  // Input values
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [newAppointDate, setNewAppointDate] = useState("");

  const [datecheck, setDateCheck] = useState(null);
  const [doctorId, setDoctorId] = useState(null);

  const [test, setTest] = useState(null);

  // Set value newAppointDate
  const onChangenewAppointDate = (e) => {
    setNewAppointDate(e.target.value);
  };

  

  // Format date in db
  function formatDateForValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  useEffect(() => {
    const user = Cookies.get('userName');
    if (user) {
      setUsername(user);
    }
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (username) {
        try {
          const response = await fetch(`http://localhost:8080/PatientAppointment2/${username}/${appointId}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setAppointments(data);
  
          if (data.length > 0) {
            const firstAppointment = data[0];
  
            // Convert appointDate (which is a string) to Date object (UTC time)
            const appointDate = new Date(firstAppointment.appointDate); // This creates a Date object in UTC
  
            // Adjust the time to UTC+7 (Thailand time)
            const thailandOffset = 7 * 60; // UTC+7 offset in minutes
            const localDate = new Date(appointDate.getTime() + thailandOffset * 60000); // Adjust to Thailand time
  
            // Format the date in the desired format: "YYYY-MM-DD HH:mm:ss"
            const formattedDate = localDate.toISOString().slice(0, 19).replace('T', ' ');
  
            setDateCheck(formattedDate);  // Set the formatted date
            setDoctorId(firstAppointment.doctorId);  // Set the doctor ID
  
            // Initialize an array to hold all appointment counts
            let newAppointmentCounts = [];
  
            // Loop to fetch date and call API for each date 7 days apart
            for (let i = 1; i <= 8; i++) {
              const newDate = new Date(localDate);
              newDate.setDate(localDate.getDate() + i * 7);  // Add 7 days for each iteration
  
              const formattedNewDate = newDate.toISOString().slice(0, 19).replace('T', ' ');
  
              try {
                const res = await axios.post('http://localhost:8080/checkdatecanpostpone', {
                  datecheck: formattedNewDate,
                  doctorId: firstAppointment.doctorId,
                });
  
                newAppointmentCounts.push({
                  datecheck: formattedNewDate,
                  count: res.data.count,
                });
              } catch (err) {
                console.error('Error fetching date:', err);
              }
            }
  
            setAppointmentCounts(newAppointmentCounts);
          }
  
          setLoading(false);
        } catch (error) {
          setError(error);
          setLoading(false);
        }
      }
    };
  
    fetchAppointments();
  }, [username, appointId]);

  useEffect(() => {
    if (appointments.length > 0) {
      const firstAppointment = appointments[0];
      const nextAppointments = getNextAppointments(firstAppointment.appointDate);
      setNewAppointments(nextAppointments);
    }
  }, [appointments]);

  

   // LINE fetchUserIdLine
  useEffect(() => {
    const fetchUserIdLine = async () => {
      console.log(username)
      try {
        const response = await axios.get(`http://localhost:8080/useridline/${username}`);
        console.log(response.data[0].UserIdLine);
        if (response.data) {
          setUserIdLine(response.data[0].UserIdLine);
        }
      } catch (error) {
        console.error("Error fetching UserIdLine:", error);
      }
    };
    fetchUserIdLine();
  }, [username]);

  // const date1 = appointments[0]?.appointDate ? new Date(appointments[0].appointDate) : null;
  // const datecheck = date1.toISOString().slice(0, 19).replace('T', ' ');
  // const doctorId = appointments[0]?.doctorId;

  // const datecheck = "2024-11-22 13:30:00";
  // const doctorId = 8;

  // console.log(newAppointments, "newAppointments")

  function formatDateForValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนต้อง +1 เพราะเดือนเริ่มจาก 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // การแปลงวันที่ใน newAppointments ให้เป็นรูปแบบที่ต้องการ
  const formattedAppointments = newAppointments.map((appointment) => {
    return formatDateForValue(appointment);  // ใช้ฟังก์ชัน formatDateForValue ในการแปลงวันที่
  });

  // console.log(formattedAppointments,"formattedAppointments")

  // useEffect(() => {
  //   const fetchAppointmentData = async () => {
  //     try {
  //       const response = await axios.post('http://localhost:8080/checkdatecanpostpone', {
  //         datecheck,
  //         doctorId
  //       });
  //       if (response.data) {
  //         setAppointmentCount(response.data.count);
  //       }
  //     } catch (error) {
  //       console.error("Error count appoint:", error);
  //     }
  //   };
  //   if(datecheck && doctorId){
  //     fetchAppointmentData();
  //   }
  // }, [datecheck, doctorId]);

//   useEffect(() => {
//     const fetchAppointmentData = async () => {
//       // สร้าง array ของ Promise สำหรับแต่ละวันที่เราต้องการเรียก API
//       const promises = formattedAppointments.map(async (date) => {
//         try {
//           const response = await axios.post('http://localhost:8080/checkdatecanpostpone', {
//             datecheck: date,  // ส่ง datecheck เป็นวันที่
//             doctorId: doctorId // ส่ง doctorId ไปด้วย
//           });
//           // ถ้าได้ผลลัพธ์ จะเก็บใน array ที่มี datecheck และ count
//           return {
//             datecheck: date,
//             count: response.data.count
//           };
//         } catch (error) {
//           console.error("Error counting appointment:", error);
//           return { datecheck: date, count: 0 }; // ถ้า error ให้กำหนด count เป็น 0
//         }
//       });

//       // ใช้ Promise.all เพื่อรอให้เรียก API สำหรับทุกๆ วันเสร็จพร้อมกัน
//       const results = await Promise.all(promises);
      
//       // เก็บผลลัพธ์ลงใน state
//       setAppointmentCounts(results);
//     };

//     // เรียกใช้ฟังก์ชันเมื่อ datecheck และ doctorId มีค่า
//     if (datecheck && doctorId) {
//       fetchAppointmentData();
//     }
//   // }, [datecheck, doctorId, formattedAppointments]);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  function getNextAppointments(appointDate) {
    const date = new Date(appointDate);
    const result = [];
    const targetDay = date.getDay(); 
    let count = 0;
  
    while (count <= 8) {
      if (date.getDay() === targetDay) {
        // Can Check Here
        result.push(new Date(date));
        count++;
      }
      date.setDate(date.getDate() + 1);
    }
    return result;
  }

  

  const handleSubmit = () => {
    fetch(`http://localhost:8080/PatientPostpone/${appointId}/${userIdLine}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newAppointDate,
        reason,
        email,
        requestPhone,
      }),
    })
      .then(response => response.text())
      .then(data => {
        console.log(data);
        // navigate('/Appointment/AppointmentDetails');
        navigate(`/Appointment/AppointmentDetails?appointId=${appointId}`);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };


  const formatDate = (dateString) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
  
    const date = new Date(dateString);
    const day = date.getDate(); // วันที่
    const month = months[date.getMonth()]; // ชื่อเดือนภาษาไทย
    const year = date.getFullYear() + 543; // แปลงปีเป็นพุทธศักราช
    const hours = date.getHours().toString().padStart(2, '0'); // ชั่วโมง (เพิ่ม 0 นำหน้าหากน้อยกว่า 10)
    const minutes = date.getMinutes().toString().padStart(2, '0'); // นาที (เพิ่ม 0 นำหน้าหากน้อยกว่า 10)
  
    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  };
  
  // console.log(appointmentCounts)
  return (
    <div>
      <div className="p-4 space-y-12">
        <div className="">
          <h2 className="text-lg">นัดหมายเดิม</h2>
          {/* {datecheck} {doctorId} {test} {appointments[0].appointDate} {appointments[0].doctorId} {appointments[0].HN} */}
          {/* {appointmentCount}  */}
          {/* <h1>User ID Line: {userIdLine}</h1>
          <h1>UserName: {username}</h1> */}
          {appointments.map((appointment) => (
            <div key={appointment.appointId} className="pt-2">
              <h3 className="text-md">{new Date(appointment.appointDate).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</h3>
              <div className="">{new Date(appointment.appointDate).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })} น.</div>
            </div>
          ))}
        </div>
        <div className="">
          <h2 className="text-lg">นัดหมายใหม่</h2>
          {/* NEW! */}
          <Radio.Group onChange={onChangenewAppointDate} value={newAppointDate}>
            {appointmentCounts
              .filter((appointment) => appointment.count < 5)
              .map((appointment) => (
                <Radio
                  key={appointment.datecheck}
                  value={appointment.datecheck}
                  style={{ fontSize: "16px" }} // เพิ่มขนาดตัวอักษร
                >
                  {formatDate(appointment.datecheck)}
                </Radio>
              ))}
          </Radio.Group>


          
          {/* {console.log("newAppointments", newAppointments)}
          {console.log("appointmentCounts", appointmentCounts)}
          {console.log("newAppointDate", newAppointDate)} */}
          {/*  Count: {appointment.count} นัดหมอคนนี้ไปแล้วกี่คน ตอนนี้ตั้งไว้ว่าต้องไม่เกิน 5 คน ถ้าจะปรับให้นัดได้มากกว่า 5 คน แก้ตรง filter ตรง Radio.Group*/}



          <div className="mt-8"></div>

          <div className="space-y-4">
            <div>
              <div>เหตุผล</div>
              <Input placeholder="เหตุผล" onChange={e => setReason(e.target.value)} />
            </div>
            <div>
              <div>อีเมลล์</div>
              <Input placeholder="อีเมลล์" onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div>เบอร์โทร</div>
              <Input placeholder="เบอร์โทร" onChange={e => setRequestPhone(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center">
        <button className="bt-blue" onClick={handleSubmit}>ยืนยันการเลื่อนการนัดหมาย</button>
      </div>
    </div>
  );
};

export default PostponeAppointment;
