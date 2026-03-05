import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleSelect() {
  const nav = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // If already logged in, redirect to their dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      nav(user.role === 'hr' ? '/hr' : '/candidate');
    }
  }, [isAuthenticated, user, nav]);

  const roles = [
    {
      id: 'candidate',
      title: 'Candidate',
      desc: 'Get your resume analyzed, discover skill gaps, and get personalized career roadmaps.',
      icon: '🎯',
      gradient: 'from-indigo-500 to-purple-600',
      lightBg: 'bg-indigo-50',
      route: '/signup',
    },
    {
      id: 'hr',
      title: 'HR / Organization',
      desc: 'Screen resumes at scale, rank candidates, and find the best talent efficiently.',
      icon: '🏢',
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50',
      route: '/signup',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold mb-4 shadow-lg">
            RS
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How will you use ResumeScreener?</h1>
          <p className="text-gray-500">Choose your role to get started with the right experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => nav(role.route)}
              className="group text-left bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`w-14 h-14 ${role.lightBg} rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {role.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{role.desc}</p>
              <span className={`inline-flex items-center text-sm font-semibold bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent`}>
                Get started →
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Already have an account?{' '}
          <button onClick={() => nav('/login')} className="text-indigo-600 font-semibold hover:text-indigo-700">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
