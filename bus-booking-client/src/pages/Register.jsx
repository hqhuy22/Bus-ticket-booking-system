import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/form/AuthForm';

export default function Register() {
  const mobileOpen = useSelector(state => state.theme.isMobileOpen);
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token || isLoggedIn) {
      navigate('/bus-booking/dashboard');
    }
  }, [isLoggedIn, navigate]);

  return (
    <div
      className={` bg-white flex justify-center items-center ${mobileOpen && 'hidden'} min-h-[70vh] pt-24 pb-20`}
    >
      <AuthForm authMethod={'register'} />
    </div>
  );
}
