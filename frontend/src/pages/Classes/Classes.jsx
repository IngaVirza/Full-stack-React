import React, { useEffect, useState } from 'react';
import { useAxiosFetch } from '../../hooks/useAxiosFetch';
import { Link } from '@mui/material';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const axiosFetch = useAxiosFetch();

  const handleHover = (index) => {
    setHoveredCard(index);
  };

  useEffect(() => {
    axiosFetch
      .get('/classes')
      .then((res) => setClasses(res.data))
      .catch((err) => console.log(err));
  }, []);

  console.log(classes);
  return (
    <div>
      <div className="mt-20 pt-3">
        <h1 className="text-4xl font-bold text-center text-secondary">
          Classes
        </h1>
      </div>
      <div className="my-16 w-[90%] mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {classes.map((cls, index) => (
          <div
            onMouseLeave={() => handleHover(null)}
            key={index}
            className={`relative hover:-translate-y-2 duration-150 hover:ring-[2px] hover:ring-secondary w-64 h-[350px] mx-auto ${
              cls.availableSeats < 1 ? 'bg-red-300' : 'bg-white'
            } dark:bg-slate-600 rounded-lg shadow-lg overflow-hidden cursor-pointer`}
            onMouseEnter={() => handleHover(index)}
          >
            <div className="relative h-48">
              <div
                className={`absolute inset-0 bg-black opacity-0 transition-opacity duration-300 ${
                  hoveredCard === index ? 'opacity-60' : ''
                }`}
              />
              <img
                src={cls.image}
                alt=""
                className="object-cover w-full h-full"
              />
              <Transition
                show={hoveredCard === index}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                Leave="transition-opacity duration-300"
                LeaveFrom="opacity-100"
                LeaveTo="opacity-0"
              >
                <div className="absolute insert-0 flex items-center justify-center">
                  <button className="px-4 py-2 text-white disabled:bg-red-300 bg-secondary duration-300 rounded hover:bg-red-700">
                    Add to Cart
                  </button>
                </div>
              </Transition>
            </div>
            {/* details */}
            <div className="px-6 py-2">
              <h3 className="font-semibold mb-1">{cls.name}</h3>
              <p className="text-gray-500-xs">
                Instructor: {cls.instructorName}
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-600 text-xs">
                  Available Seats: {cls.availableSeats}
                </span>
                <span className="text-green-500 font-semibold">
                  ${cls.price}
                </span>
              </div>
              <Link to={`/class/${cls._id}`}>
                <button className="px-4 py-2 w-full mx-auto text-white disabled:bg-red-300 bg-secondary duration-300 rounded hover:bg-red-700">
                  View
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classes;
