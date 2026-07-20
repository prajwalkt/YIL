"use client";

import { useState } from "react";
import {
  Play,
  BookOpen,
  Lock,
  LogOut,
  ArrowLeft,
  User,
  Eye,
  EyeOff
} from "lucide-react";

export default function ELearningPortal() {

  const USERNAME = "demo";
  const PASSWORD = "yokogawa123";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [page, setPage] = useState<
    "home" |
    "video" |
    "manual"
  >("home");

  const login = () => {

    if (
      username === USERNAME &&
      password === PASSWORD
    ) {

      setLoggedIn(true);

    } else {

      alert("Invalid Username or Password");

    }

  };

  if (!loggedIn) {

    return (

<div className="min-h-screen bg-linear-to-br from-[#003B7A] via-[#004EA8] to-[#0F6DFF] flex items-center justify-center p-10">

<div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

<div className="bg-[#004098] text-white p-10">

<h1 className="text-4xl font-black">

Yokogawa

</h1>

<p className="opacity-80 mt-2">

Technical Training School

</p>

</div>

<div className="p-10">

<div className="flex justify-center mb-8">

<div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">

<Lock
size={40}
className="text-[#004098]"
/>

</div>

</div>

<h2 className="text-3xl font-bold text-center">

E-Learning Login

</h2>

<p className="text-center text-slate-500 mt-2">

Please login to continue

</p>

<div className="mt-10">

<label className="font-semibold">

Username

</label>

<div className="relative mt-2">

<User
className="absolute left-4 top-4 text-slate-400"
/>

<input
className="w-full border rounded-xl pl-12 pr-4 py-4"
value={username}
onChange={(e)=>setUsername(e.target.value)}
placeholder="Enter Username"
/>

</div>

</div>

<div className="mt-6">

<label className="font-semibold">

Password

</label>

<div className="relative mt-2">

<Lock
className="absolute left-4 top-4 text-slate-400"
/>

<input
type={showPassword?"text":"password"}
className="w-full border rounded-xl pl-12 pr-12 py-4"
value={password}
onChange={(e)=>setPassword(e.target.value)}
placeholder="Enter Password"
/>

<button

type="button"

onClick={()=>setShowPassword(!showPassword)}

className="absolute right-4 top-4"

>

{

showPassword ?

<EyeOff size={20}/>

:

<Eye size={20}/>

}

</button>

</div>

</div>

<button

onClick={login}

className="w-full mt-10 bg-[#004098] text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition"

>

LOGIN

</button>

<div className="mt-8 text-center text-sm text-slate-500">

Demo Credentials

<br/>

Username :

<b>

demo

</b>

<br/>

Password :

<b>

yokogawa123

</b>

</div>

</div>

</div>

</div>

);

}
return (

<div className="min-h-screen bg-slate-100">

<header className="bg-[#004098] text-white px-10 py-5 shadow-lg">

<div className="max-w-7xl mx-auto flex justify-between items-center">

<div>

<h1 className="text-3xl font-black">

Yokogawa Technical Training School

</h1>

<p className="text-blue-100 mt-1">

E-Learning Portal

</p>

</div>

<div className="flex items-center gap-4">

<span className="font-semibold">

Welcome,

{username}

</span>

<button

onClick={()=>{

setLoggedIn(false);

setUsername("");

setPassword("");

setPage("home");

}}

className="bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"

>

<LogOut size={18}/>

Logout

</button>

</div>

</div>

</header>

<main className="max-w-7xl mx-auto py-16 px-8">

{

page==="home" && (

<>

<h2 className="text-4xl font-black text-[#004098] mb-10">

Instrumentation Fundamentals

</h2>

<div className="grid md:grid-cols-2 gap-10">

<div

onClick={()=>setPage("video")}

className="cursor-pointer bg-white rounded-3xl shadow-xl p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-200"

>

<div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-8">

<Play

size={40}

className="text-red-600"

/>

</div>

<h3 className="text-3xl font-bold">

Training Video

</h3>

<p className="text-slate-500 mt-4 leading-7">

Watch the complete instructor-led e-learning video.

The course can be paused, resumed and replayed anytime.

</p>

<button

className="mt-10 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold"

>

Watch Video

</button>

</div>

<div

onClick={()=>setPage("manual")}

className="cursor-pointer bg-white rounded-3xl shadow-xl p-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-200"

>

<div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-8">

<BookOpen

size={40}

className="text-blue-700"

/>

</div>

<h3 className="text-3xl font-bold">

Interactive Manual

</h3>

<p className="text-slate-500 mt-4 leading-7">

Open the complete Rise 360 interactive manual exactly like the original downloaded version.

</p>

<button
  onClick={() => window.location.href = "/manuals"}
  className="mt-10 bg-[#004098] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold"
>
  Open Interactive Manuals
</button>

</div>

</div>

</>

)}

{page==="video" && (

<div>

<button

onClick={()=>setPage("home")}

className="mb-8 flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow hover:bg-slate-50"

>

<ArrowLeft size={18}/>

Back

</button>

<div className="bg-white rounded-3xl shadow-xl p-8">

<h2 className="text-3xl font-bold text-[#004098] mb-6">

Training Video

</h2>

<video

controls

className="w-full rounded-2xl shadow"

>

<source

src="/videos/course.mp4"

type="video/mp4"

/>

Your browser does not support HTML5 video.

</video>

</div>

</div>

)

}

{

page==="manual" && (

<div>

<button

onClick={()=>setPage("home")}

className="mb-8 flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow hover:bg-slate-50"

>

<ArrowLeft size={18}/>

Back

</button>

<div className="bg-white rounded-3xl shadow-xl overflow-hidden">

<div className="p-6 border-b">

<h2 className="text-3xl font-bold text-[#004098]">

Interactive Manual

</h2>

<p className="text-slate-500 mt-2">

Rise 360 Interactive Course

</p>

</div>

<iframe
  src="/manual/scormcontent/index.html"
  className="w-full h-[85vh] border-0"
  title="Interactive Manual"
/>

</div>

</div>

)

}

</main>

</div>

);

}