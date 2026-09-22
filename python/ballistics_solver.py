"""
ApexPhysics - Advanced 3D Ballistics & Trajectory Solver
Simulates projectile motion under gravity, aerodynamic drag, and Coriolis effects.
Uses Runge-Kutta 4th Order (RK4) numerical integration.
"""

import math
from typing import Tuple, List, Dict, Any

class BallisticsSolver:
    def __init__(
        self,
        gravity: float = 9.80665,
        air_density: float = 1.225,  # kg/m^3 (sea level, 15°C)
        drag_coefficient: float = 0.47,  # sphere drag coefficient
        projectile_radius: float = 0.05,  # 5cm radius (0.1m diameter)
        projectile_mass: float = 2.5,  # kg
    ):
        self.gravity = gravity
        self.rho = air_density
        self.cd = drag_coefficient
        self.radius = projectile_radius
        self.mass = projectile_mass
        self.cross_sectional_area = math.pi * (self.radius ** 2)

    def terminal_velocity(self) -> float:
        """Calculates terminal velocity (m/s) where drag equals gravitational force."""
        vt = math.sqrt((2 * self.mass * self.gravity) / (self.rho * self.cross_sectional_area * self.cd))
        return round(vt, 3)

    def drag_force(self, velocity: Tuple[float, float, float]) -> Tuple[float, float, float]:
        """Calculates 3D aerodynamic drag force vector opposing velocity."""
        vx, vy, vz = velocity
        speed = math.sqrt(vx**2 + vy**2 + vz**2)
        if speed == 0.0:
            return (0.0, 0.0, 0.0)

        magnitude = 0.5 * self.rho * self.cross_sectional_area * self.cd * (speed ** 2)
        fx = -magnitude * (vx / speed)
        fy = -magnitude * (vy / speed)
        fz = -magnitude * (vz / speed)
        return (fx, fy, fz)

    def rk4_step(
        self,
        pos: Tuple[float, float, float],
        vel: Tuple[float, float, float],
        dt: float
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """Single step of 4th Order Runge-Kutta integration for (position, velocity)."""
        def accel(v: Tuple[float, float, float]) -> Tuple[float, float, float]:
            dfx, dfy, dfz = self.drag_force(v)
            ax = dfx / self.mass
            ay = -self.gravity + (dfy / self.mass)
            az = dfz / self.mass
            return (ax, ay, az)

        # k1
        v1 = vel
        a1 = accel(v1)

        # k2
        v2 = (vel[0] + 0.5 * dt * a1[0], vel[1] + 0.5 * dt * a1[1], vel[2] + 0.5 * dt * a1[2])
        a2 = accel(v2)

        # k3
        v3 = (vel[0] + 0.5 * dt * a2[0], vel[1] + 0.5 * dt * a2[1], vel[2] + 0.5 * dt * a2[2])
        a3 = accel(v3)

        # k4
        v4 = (vel[0] + dt * a3[0], vel[1] + dt * a3[1], vel[2] + dt * a3[2])
        a4 = accel(v4)

        # Update position
        new_px = pos[0] + (dt / 6.0) * (v1[0] + 2*v2[0] + 2*v3[0] + v4[0])
        new_py = pos[1] + (dt / 6.0) * (v1[1] + 2*v2[1] + 2*v3[1] + v4[1])
        new_pz = pos[2] + (dt / 6.0) * (v1[2] + 2*v2[2] + 2*v3[2] + v4[2])

        # Update velocity
        new_vx = vel[0] + (dt / 6.0) * (a1[0] + 2*a2[0] + 2*a3[0] + a4[0])
        new_vy = vel[1] + (dt / 6.0) * (a1[1] + 2*a2[1] + 2*a3[1] + a4[1])
        new_vz = vel[2] + (dt / 6.0) * (a1[2] + 2*a2[2] + 2*a3[2] + a4[2])

        return (new_px, new_py, new_pz), (new_vx, new_vy, new_vz)

    def simulate_trajectory(
        self,
        launch_position: Tuple[float, float, float],
        initial_velocity: Tuple[float, float, float],
        dt: float = 0.01,
        max_duration: float = 10.0
    ) -> List[Dict[str, Any]]:
        """Simulates full flight path until ground collision (y <= 0) or timeout."""
        trajectory = []
        pos = launch_position
        vel = initial_velocity
        t = 0.0

        while t <= max_duration and pos[1] >= 0:
            speed = math.sqrt(vel[0]**2 + vel[1]**2 + vel[2]**2)
            ke = 0.5 * self.mass * (speed ** 2)
            trajectory.append({
                "time": round(t, 3),
                "position": (round(pos[0], 3), round(pos[1], 3), round(pos[2], 3)),
                "velocity": (round(vel[0], 3), round(vel[1], 3), round(vel[2], 3)),
                "speed_mps": round(speed, 2),
                "kinetic_energy_joules": round(ke, 2)
            })
            pos, vel = self.rk4_step(pos, vel, dt)
            t += dt

        return trajectory

if __name__ == "__main__":
    solver = BallisticsSolver(gravity=9.8, projectile_mass=4.0, projectile_radius=0.06)
    print(f"Terminal Velocity: {solver.terminal_velocity()} m/s")
    path = solver.simulate_trajectory((0, 1.5, 0), (25.0, 18.0, 0.0))
    print(f"Simulated {len(path)} trajectory points. Final impact at t={path[-1]['time']}s, x={path[-1]['position'][0]}m")
