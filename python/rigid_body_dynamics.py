"""
ApexPhysics - Rigid Body Dynamics & Collision Impulse Engine
Implements 3D moment of inertia tensors, angular momentum, and impulse-based collision response.
"""

import math
from typing import Tuple, List, Optional

Vector3 = Tuple[float, float, float]
Matrix3x3 = List[List[float]]

class RigidBody3D:
    def __init__(
        self,
        name: str,
        mass: float,
        shape: str,
        dimensions: Vector3,  # (width, height, depth) or (radius, 0, 0)
        position: Vector3 = (0.0, 0.0, 0.0),
        linear_velocity: Vector3 = (0.0, 0.0, 0.0),
        angular_velocity: Vector3 = (0.0, 0.0, 0.0),
        restitution: float = 0.6,
        friction: float = 0.4
    ):
        self.name = name
        self.mass = mass
        self.inv_mass = 1.0 / mass if mass > 0 else 0.0
        self.shape = shape
        self.dimensions = dimensions
        self.position = list(position)
        self.linear_velocity = list(linear_velocity)
        self.angular_velocity = list(angular_velocity)
        self.restitution = restitution
        self.friction = friction

        # Compute diagonal moment of inertia tensor in body coordinates
        self.inertia_tensor = self._compute_inertia_tensor()
        self.inv_inertia_tensor = [
            [1.0 / self.inertia_tensor[i][j] if (i == j and self.inertia_tensor[i][j] > 0) else 0.0 for j in range(3)]
            for i in range(3)
        ]

    def _compute_inertia_tensor(self) -> Matrix3x3:
        """Calculates moment of inertia principal diagonal matrix."""
        m = self.mass
        tensor = [[0.0 for _ in range(3)] for _ in range(3)]

        if self.shape == "sphere":
            r = self.dimensions[0]
            val = (2.0 / 5.0) * m * (r ** 2)
            tensor[0][0] = val
            tensor[1][1] = val
            tensor[2][2] = val
        elif self.shape == "box":
            w, h, d = self.dimensions
            tensor[0][0] = (1.0 / 12.0) * m * (h**2 + d**2)
            tensor[1][1] = (1.0 / 12.0) * m * (w**2 + d**2)
            tensor[2][2] = (1.0 / 12.0) * m * (w**2 + h**2)
        elif self.shape == "cylinder":
            r, h, _ = self.dimensions
            tensor[0][0] = (1.0 / 12.0) * m * (3 * r**2 + h**2)
            tensor[1][1] = 0.5 * m * (r**2)
            tensor[2][2] = (1.0 / 12.0) * m * (3 * r**2 + h**2)

        return tensor

    def total_kinetic_energy(self) -> float:
        """Calculates combined translational + rotational kinetic energy in Joules."""
        vx, vy, vz = self.linear_velocity
        speed_sq = vx**2 + vy**2 + vz**2
        translational_ke = 0.5 * self.mass * speed_sq

        wx, wy, wz = self.angular_velocity
        rotational_ke = 0.5 * (
            self.inertia_tensor[0][0] * wx**2 +
            self.inertia_tensor[1][1] * wy**2 +
            self.inertia_tensor[2][2] * wz**2
        )
        return round(translational_ke + rotational_ke, 3)

    def linear_momentum(self) -> Vector3:
        """Returns linear momentum vector p = m * v."""
        return (
            self.mass * self.linear_velocity[0],
            self.mass * self.linear_velocity[1],
            self.mass * self.linear_velocity[2]
        )

def resolve_elastic_collision_1d(
    m1: float, v1: float,
    m2: float, v2: float,
    e: float = 1.0
) -> Tuple[float, float]:
    """1D impulse resolution with coefficient of restitution e."""
    total_m = m1 + m2
    v1_f = ((m1 - e * m2) * v1 + (1.0 + e) * m2 * v2) / total_m
    v2_f = ((m2 - e * m1) * v2 + (1.0 + e) * m1 * v1) / total_m
    return round(v1_f, 3), round(v2_f, 3)

if __name__ == "__main__":
    sphere = RigidBody3D("IronCannonball", mass=12.0, shape="sphere", dimensions=(0.15, 0, 0), linear_velocity=(10.0, 0, 0))
    box = RigidBody3D("WoodenCrate", mass=6.0, shape="box", dimensions=(0.5, 0.5, 0.5), linear_velocity=(0, 0, 0))

    print(f"Cannonball Kinetic Energy: {sphere.total_kinetic_energy()} J")
    print(f"Inertia Tensor Sphere: {sphere.inertia_tensor[0][0]:.4f} kg*m^2")
    v1_after, v2_after = resolve_elastic_collision_1d(sphere.mass, 10.0, box.mass, 0.0, e=0.7)
    print(f"Post-collision velocities: Sphere={v1_after} m/s, Box={v2_after} m/s")
