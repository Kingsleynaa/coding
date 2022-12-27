import { useEffect } from 'react'
import { SidebarProject } from '../components/SidebarProject'
import $ from "jquery"
import { Navbar } from '../components/Navbar'
import { Breadcrumb } from '../components/Breadcrumb'

const showSidebar = () => {
  $(".sidebar-mobile").removeClass("d-none")
  $(".sidebar-mobile").removeClass("slide-left")
  $(".sidebar-mobile").addClass("slide-right")
  $(".mobile-backdrop").removeClass("d-none")
  $(".mobile-backdrop").addClass("fade-in")
}

const hideSidebar = () => {
  $(".mobile-backdrop").removeClass("fade-in");
  $(".mobile-backdrop").addClass("d-none");
  $(".sidebar-mobile").addClass("slide-left");
  $(".sidebar-mobile").removeClass("slide-right");
}

export const LayoutRisk = (props) => {

  useEffect(() => {
    var onDesktop = window.matchMedia("(min-width: 992px)")

    const changeMarginForMain = () => {
      if (onDesktop.matches) {
        $(".main").css("margin-left", $(".sidebar-desktop").innerWidth())
        $(".content").css("margin-top", $("#navbar-desktop").innerHeight())
        $(".notifications").css("left", "")
        $(".notifications").css("right", "")
        $(".notifications").css("top", "")
      } else {
        $(".main").css("margin-left", 0)
        $(".content").css("margin-top", $("#navbar-mobile").innerHeight())
        $(".notifications").css("left", "-100px")
        $(".notifications").css("right", "auto")
        $(".notifications").css("top", "50px")
      }
    }

    // Pushing the main content down by the navbar height
    $(".content").css("margin-top", $("#navbar").innerHeight())

    changeMarginForMain()

    // Checking for screen size and deciding whether to hide or show sidebar
    window.addEventListener('resize', changeMarginForMain);
    onDesktop.addListener(changeMarginForMain);
  })

  return (
    <>
      <Navbar />
      <div className='row content'>
        {/* Desktop Sidebar */}
        <div className="col-lg-2 bg-light d-none d-lg-block sidebar-desktop fixed-sidebar">
          <SidebarProject />
        </div>

        {/* Mobile Sidebar */}
        <div className="col-sm-5 col-md-4 col-7 bg-light d-lg-none d-none sidebar-mobile fixed-sidebar">
          <SidebarProject />
        </div>

        {/* Backdrop for mobile sidebar */}
        <div className="d-none d-lg-none mobile-backdrop" onClick={hideSidebar}></div>

        <div className="col-lg-10 main">
          <div className='row justify-content-center'>
            <div className='col-lg-11 col-md-9'>
              <div className="d-flex align-content-center py-3">

                {/* Button to toggle sidebar on mobile */}
                <button className="font-xsm btn btn-light text-secondary border d-lg-none align-self-center me-3" onClick={showSidebar}>
                  <i className='fa fa-bars'></i>
                </button>

                {/* Place breadcrumb here */}
                <Breadcrumb />
              </div>

              <hr className="my-0" />

              {/* Content for each page */}
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

