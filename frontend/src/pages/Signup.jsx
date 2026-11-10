import { AuthContext } from '../context/AuthContext.jsx'; // Added curly braces { }
import { useNavigate, Link } from "react-router-dom";
import { useState, useContext } from "react"
import { Bike, User, Mail, Phone, Lock } from "lucide-react"

const Signup = () => {
    // set up state for inputs
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { registerUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // handle form input changes dynamically 
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    // handle the form 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await registerUser(formData.username, formData.password, formData.email, formData.phone);
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 transition duration-300">

                {/* header/logo */}

                <div className="flex flex-col items-center mb-8">
                    <div className="bg-emerald-500 p-3 rounded-full mb-3 shadow-lg shadow-emerald-500/20">
                        <Bike className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
                    <p className="text-slate-400 text-sm mt-1">Join BikeGo</p>
                </div>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* userName */}
                    <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                              <User className="w-5 h-5"/>
                            </span>
                            <input
                               type="text"
                               name="username"
                               required
                               value={formData.username}
                               onChange={handleChange}
                               placeholder="Enter your name"
                               className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                                
                            />                           
                           </div>
                    </div>
                    {/* email */}
                    <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                              <Mail className="w-5 h-5"/>
                            </span>
                            <input
                               type="email"
                               name="email"
                               required
                               value={formData.email}
                               onChange={handleChange}
                               placeholder="Enter your email"
                               className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                                
                            />                           
                           </div>
                    </div>
                    {/* phone */}
                     <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                              <Phone className="w-5 h-5"/>
                            </span>
                            <input
                               type="tel"
                               name="phone"
                               required
                               value={formData.phone}
                               onChange={handleChange}
                               placeholder="Enter your Phone number"
                               className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                                
                            />                           
                           </div>
                    </div>
                    {/* Password */}
                     <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                              <Lock className="w-5 h-5"/>
                            </span>
                            <input
                               type="password"
                               name="password"
                               required
                               value={formData.password}
                               onChange={handleChange}
                               placeholder="Enter your password"
                               className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                                
                            />                           
                           </div>
                    </div>
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition duration-150 shadow-lg shadow-emerald-500/20 disabled:bg-emerald-700 disabled:cursor-not-allowed mt-6 text-sm"    
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    
                      {/* Link to Login */}
                    <p className="text-center text-sm text-slate-400 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition duration-150">
                           Login
                        </Link>  
                    </p>
                </form>
            </div>
        </div>
    );
};
export default Signup;