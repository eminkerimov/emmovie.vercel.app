import React from "react";
import Home from "./pages/Home/Home";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Movie from "./pages/Movie/Movie";

function App() {
  const router =createBrowserRouter([
        {
          path:"/",
          element:<Home/>
        },
        {
          path:"/movie/:id",
          element:<Movie/>
        }
      ]
  )

  return (
    <div>
      <RouterProvider router={router}/>
    </div>
  );
}

export default App;
